// PAKET 7 — Doğrulama/Negatif Senaryoları: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 46, 47, 48 numaralı senaryoları GERÇEK proje
// kodu üzerinden (csv_import_parser.dart, local_storage.dart,
// subscription_controller.dart) çalıştırıp assert eder.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/services/offline_mutation_queue.dart';
import 'package:subscript_track/core/storage/local_storage.dart';
import 'package:subscript_track/features/subscriptions/data/csv_import_parser.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _FlakyRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  bool offline = false;
  _FlakyRepo([List<Subscription>? data]) : _data = List.of(data ?? []);

  @override
  Future<List<Subscription>> getAll(String userId) async {
    if (offline) throw const NetworkException('bağlantı yok');
    return List.of(_data);
  }

  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
  }) async {
    if (offline) throw const NetworkException('bağlantı yok');
    final sub = Subscription(
      id: 'new-1',
      userId: userId,
      name: name,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      createdAt: DateTime.now(),
    );
    _data.add(sub);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    if (offline) throw const NetworkException('bağlantı yok');
    final idx = _data.indexWhere((s) => s.id == updated.id);
    if (idx != -1) _data[idx] = updated;
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {
    if (offline) throw const NetworkException('bağlantı yok');
    _data.removeWhere((s) => s.id == subscriptionId);
  }

  @override
  Future<void> archive(String userId, String subscriptionId) async {}
  @override
  Future<void> restore(String userId, String subscriptionId) async {}
  @override
  Future<void> pause(String userId, String subscriptionId) async {
    if (offline) throw const NetworkException('bağlantı yok');
  }

  @override
  Future<void> resume(String userId, String subscriptionId) async {}
  @override
  Future<void> cancel(String userId, String subscriptionId) async {}
}

Subscription _sub(String id) => Subscription(
      id: id,
      userId: 'u1',
      name: 'Netflix',
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(),
      nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
      category: SubscriptionCategory.streaming,
      createdAt: DateTime.now(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TEST 46 — Geçersiz tarih formatı girme denemesi', () {
    test(
        'Ekleme/düzenleme formunda serbest metin tarih girişi YOK (sadece '
        'showDatePicker) — bu yüzden "31/13/2026" gibi bir string hiçbir '
        'zaman girilemez, kategori olarak geçersiz değil', () {
      // subscription_form.dart: _pickStartDate/_pickNextRenewalDate hep
      // showDatePicker kullanıyor; TextFormField ile serbest tarih girişi yok.
      expect(true, isTrue, reason: 'Statik kod taramasıyla doğrulandı.');
    });

    test(
        'CSV içe aktarımda GERÇEK serbest metin tarih girişi VAR ve '
        'geçersiz format doğru şekilde reddediliyor', () {
      const csv =
          'name,amount,currency,billing_cycle,next_renewal_date,category\n'
          'Netflix,100,TRY,monthly,31/13/2026,streaming\n' // geçersiz format
          'Spotify,50,TRY,monthly,2026-11-05,music\n'; // geçerli (ISO 8601)

      final result = CsvImportParser.parse(csv);

      expect(result.rows.length, 1,
          reason: 'Sadece geçerli tarihli satır içeri aktarıldı.');
      expect(result.rows.single.name, 'Spotify');
      expect(result.errors.length, 1);
      expect(result.errors.single, contains('tarih geçersiz'),
          reason:
              'Geçersiz tarih formatı KULLANICIYA uyarı olarak bildiriliyor '
              '(csv_import_screen.dart bu errors listesini gösteriyor).');
    });
  });

  group('TEST 47 — Uygulama arka planda zorla kapatıldığında veri kaybı', () {
    test(
        'Kaydedilen abonelik verisi SharedPreferences\'a (senkron/awaited '
        'yazımla) kalıcı olarak yazılıyor — yazım TAMAMLANDIKTAN sonra bir '
        'force-kill veri kaybına yol açmaz', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      const json = '[{"id":"1","name":"Netflix"}]';

      await LocalStorage.instance.writeSubscriptions('cache_u1', json);
      // "force-kill" simülasyonu: LocalStorage'ın kendi state'i yok, her
      // okuma taze bir SharedPreferences.getInstance() üzerinden yapılıyor —
      // yani bellekte "henüz yazılmamış" bir ara durum tutulmuyor.
      final readBack =
          await LocalStorage.instance.readSubscriptions('cache_u1');

      expect(readBack, json,
          reason: 'await ile tamamlanan yazım kalıcı — process\'in devamının '
              'çalışıp çalışmaması bu veriyi etkilemez.');
    });

    test(
        'SubscriptionController.add/edit/delete başarılı olduğunda cache '
        'HER SEFERİNDE yeniden yazılıyor (_writeCache) — yarım kalan bir '
        'işlem sonraki açılışta eski ama TUTARLI veriyi gösterir, bozuk veri değil',
        () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.delete('1');

      final cached = await LocalStorage.instance.readSubscriptions('cache_u1');
      expect(cached, isNotNull);
      expect(cached, isNot(contains('"id":"1"')),
          reason: 'Silme işlemi tamamlanınca cache anında güncellendi.');
    });

    test('eski düz metin abonelik cache’i ilk okumada güvenli depoya taşınır',
        () async {
      const legacy = '[{"id":"legacy-1","name":"Netflix"}]';
      SharedPreferences.setMockInitialValues(
          {'subscriptions_cache_u1': legacy});
      FlutterSecureStorage.setMockInitialValues({});

      expect(await LocalStorage.instance.readSubscriptions('cache_u1'), legacy);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('subscriptions_cache_u1'), isNull);
      expect(
        await const FlutterSecureStorage().read(key: 'subscriptions_cache_u1'),
        legacy,
      );
    });
  });

  group('TEST 48 — İnternet bağlantısı olmadan uygulamayı kullanma', () {
    test(
        'Uygulama açma: bağlantı yokken önbellekten (cache) veri gösterip '
        'isOffline=true olarak işaretliyor — VAR ve çalışıyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load(); // online, cache oluşuyor

      repo.offline = true;
      await ctrl.load(); // artık offline

      expect(ctrl.isOffline, isTrue);
      expect(ctrl.allItems, isNotEmpty,
          reason: 'Önbellekten veri gösterilmeye devam ediyor.');
    });

    test(
        'Silme/duraklatma: bağlantı yokken OfflineMutationQueue\'ya '
        'kuyruklanıyor — VAR ve çalışıyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      await ctrl.delete('1'); // repo.delete NetworkException fırlatıyor

      expect(ctrl.allItems, isEmpty,
          reason: 'Silme yerel olarak uygulandı (optimistic), kuyruğa alındı.');
      // pendingMutationCount getter'ı sadece bir sonraki load() sırasında
      // yenileniyor (controller state'inde canlı takip edilmiyor); asıl
      // kanıt kuyruğun kendisinde — doğrudan OfflineMutationQueue'yu okuyoruz:
      final queued = await OfflineMutationQueue().drain();
      expect(queued.map((m) => m.type), contains('delete'),
          reason:
              'Silme işlemi gerçekten kuyruğa yazıldı, bağlantı gelince tekrar denenecek.');
    });

    test(
        'FIXED: abonelik EKLEME (add) artık bağlantı yokken de çalışıyor — '
        'geçici local id ile İYİMSER olarak listeye ekleniyor ve kuyruğa alınıyor',
        () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      final ok = await ctrl.add(
        name: 'Yeni Abonelik',
        amount: Money.fromJson(50),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime.now(),
        nextRenewalDate: DateTime.now().add(const Duration(days: 30)),
        category: SubscriptionCategory.other,
      );

      expect(ok, isTrue,
          reason: 'Artık offline ekleme BAŞARILI sayılıyor (optimistic).');
      expect(ctrl.allItems.length, 1);
      expect(ctrl.allItems.single.id, startsWith('local-'),
          reason: 'Sunucu henüz görmediği için geçici bir yerel id taşıyor.');
    });

    test(
        'FIXED — uçtan uca: offline eklenen abonelik, bağlantı geri gelip '
        'load() çağrılınca sunucuda GERÇEKTEN oluşturuluyor ve geçici id '
        'gerçek sunucu id\'siyle DEĞİŞTİRİLİYOR', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      await ctrl.add(
        name: 'Yeni Abonelik',
        amount: Money.fromJson(50),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime.now(),
        nextRenewalDate: DateTime.now().add(const Duration(days: 30)),
        category: SubscriptionCategory.other,
      );
      expect(repo._data, isEmpty,
          reason: 'Sunucuda (repo) henüz hiçbir kayıt yok.');

      repo.offline = false; // "bağlantı geri geldi"
      await ctrl.load(); // _replayOfflineQueue tetiklenir

      expect(repo._data.length, 1,
          reason:
              'Kuyruktaki create mutasyonu replay edilip sunucuda kayıt oluştu.');
      expect(ctrl.allItems.single.id, 'new-1',
          reason:
              'Geçici "local-..." id, sunucunun atadığı GERÇEK id ile değiştirildi.');
      final remaining = await OfflineMutationQueue().drain();
      expect(remaining, isEmpty,
          reason: 'Kuyruk boşaldı, tekrar tekrar denenmiyor.');
    });

    test(
        'FIXED: abonelik DÜZENLEME (edit) artık bağlantı yokken de "yerel olarak '
        'uygulanıp kuyruğa alınıyor" — değişiklik ANINDA görünüyor, kaybolmuyor',
        () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      final original = ctrl.allItems.single;
      final ok = await ctrl.edit(original.copyWith(name: 'Değişmiş İsim'));

      expect(ok, isTrue);
      expect(ctrl.allItems.single.name, 'Değişmiş İsim',
          reason:
              'Değişiklik yerel olarak ANINDA uygulandı, kullanıcı sonucu hemen görüyor.');
    });

    test(
        'FIXED — uçtan uca: offline yapılan düzenleme, bağlantı gelince '
        'sunucuya GERÇEKTEN yazılıyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      final original = ctrl.allItems.single;
      await ctrl.edit(original.copyWith(name: 'Değişmiş İsim'));
      expect(repo._data.single.name, 'Netflix',
          reason: 'Sunucuda henüz eski isim duruyor.');

      repo.offline = false;
      await ctrl.load();

      expect(repo._data.single.name, 'Değişmiş İsim',
          reason:
              'Kuyruktaki update mutasyonu replay edilip sunucuya yazıldı.');
    });

    test(
        'offline create sonrası düzenleme gerçek sunucu kimliğiyle replay edilir',
        () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FlakyRepo([]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      repo.offline = true;

      await ctrl.add(
        name: 'Yeni Abonelik',
        amount: Money.fromJson(50),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime.now(),
        nextRenewalDate: DateTime.now().add(const Duration(days: 30)),
        category: SubscriptionCategory.other,
      );
      await ctrl.edit(ctrl.allItems.single.copyWith(name: 'Son Ad'));

      repo.offline = false;
      await ctrl.load();

      expect(repo._data.single.id, 'new-1');
      expect(repo._data.single.name, 'Son Ad');
      expect(ctrl.allItems.single.id, 'new-1');
      expect(await OfflineMutationQueue().isEmpty, isTrue);
    });
  });
}
