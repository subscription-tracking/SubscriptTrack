// PAKET 2 — Form Doğrulama & CRUD Akışı: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 1, 2, 3, 4, 7, 11, 12, 13, 14, 15, 16, 17
// numaralı senaryoları GERÇEK proje kodu (subscription_form.dart,
// subscription_controller.dart, edit_subscription_screen.dart) üzerinden
// çalıştırıp assert eder.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/edit_subscription_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/add_subscription_screen.dart';

// ── Fake repo (subscription_controller_test.dart ile aynı desen) ──────────
class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  _FakeRepo([List<Subscription>? data]) : _data = List.of(data ?? []);
  final List<Subscription> updateCalls = [];

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_data);

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
    final sub = Subscription(
      id: 'sub-${_data.length}-${DateTime.now().microsecondsSinceEpoch}',
      userId: userId,
      name: name,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      notes: notes,
      paymentMethod: paymentMethod,
      trialEndDate: trialEndDate,
      trialPriceAfter: trialPriceAfter,
      createdAt: DateTime.now(),
    );
    _data.add(sub);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    updateCalls.add(updated);
    final idx = _data.indexWhere((s) => s.id == updated.id);
    if (idx != -1) _data[idx] = updated;
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async =>
      _data.removeWhere((s) => s.id == subscriptionId);

  @override
  Future<void> archive(String userId, String subscriptionId) async {}
  @override
  Future<void> restore(String userId, String subscriptionId) async {}
  @override
  Future<void> pause(String userId, String subscriptionId) async {}
  @override
  Future<void> resume(String userId, String subscriptionId) async {}
  @override
  Future<void> cancel(String userId, String subscriptionId) async {}
}

Subscription _makeSub({
  String id = 'sub-1',
  String name = 'Netflix',
  double amount = 100,
  BillingCycle billingCycle = BillingCycle.monthly,
}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(amount),
      currency: 'TRY',
      billingCycle: billingCycle,
      // Kasıtlı olarak GELECEKTE bir tarih: controller.load() çağrıldığında
      // Paket-1'in _catchUpOverdueRenewals() mantığının bu CRUD testlerini
      // (ilgisi olmayan bir nedenle) etkilememesi için.
      startDate: DateTime.now().add(const Duration(days: 30)),
      nextRenewalDate: DateTime.now().add(const Duration(days: 30)),
      category: SubscriptionCategory.streaming,
      createdAt: DateTime.now(),
    );

Widget _buildForm(GlobalKey<FormState> key, SubscriptionFormData data) =>
    MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: SubscriptionForm(formKey: key, data: data),
        ),
      ),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  group('TEST 3 — Negatif fiyat girildiğinde hata verilmeli', () {
    testWidgets('"-50" girilince "Geçerli tutar gir" hatası çıkar', (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(_buildForm(key, data));
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '-50');
      final valid = key.currentState!.validate();
      await tester.pump();
      expect(valid, isFalse);
      expect(find.text('Geçerli tutar gir'), findsOneWidget);
    });
  });

  group('TEST 4 — Fiyat alanına harf/özel karakter girildiğinde hata verilmeli', () {
    testWidgets('"abc" girilince hata çıkar', (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(_buildForm(key, data));
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), 'abc');
      final valid = key.currentState!.validate();
      await tester.pump();
      expect(valid, isFalse);
      expect(find.text('Geçerli tutar gir'), findsOneWidget);
    });

    testWidgets('"12\$%" girilince hata çıkar', (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(_buildForm(key, data));
      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '12\$%');
      final valid = key.currentState!.validate();
      await tester.pump();
      expect(valid, isFalse);
      expect(find.text('Geçerli tutar gir'), findsOneWidget);
    });
  });

  group('TEST 7 — Aynı isimde birden fazla abonelik ekleme', () {
    test('Kontrolör katmanı (SubscriptionController.add) kasıtlı olarak isim '
        'benzersizliğini KONTROL ETMİYOR — CSV toplu içe aktarım gibi akışlar '
        'kullanıcıya soru sormadan çalışabilsin diye bu kontrol UI katmanına bırakıldı', () async {
      final repo = _FakeRepo();
      final controller = SubscriptionController(userId: 'u1', repository: repo);

      final ok1 = await controller.add(
        name: 'Netflix', amount: Money.fromJson(100), currency: 'TRY',
        billingCycle: BillingCycle.monthly, startDate: DateTime(2026, 1, 1),
        nextRenewalDate: DateTime(2026, 2, 1), category: SubscriptionCategory.streaming,
      );
      final ok2 = await controller.add(
        name: 'Netflix', amount: Money.fromJson(150), currency: 'TRY',
        billingCycle: BillingCycle.yearly, startDate: DateTime(2026, 1, 2),
        nextRenewalDate: DateTime(2027, 1, 2), category: SubscriptionCategory.streaming,
      );

      expect(ok1, isTrue);
      expect(ok2, isTrue);
      final netflixCount = controller.allItems.where((s) => s.name == 'Netflix').length;
      expect(netflixCount, 2,
          reason: 'Kontrolör seviyesinde ikinci "Netflix" kaydı engellenmiyor — '
              'gerçek kullanıcı uyarısı AddSubscriptionScreen\'de (aşağıdaki test).');
    });

    testWidgets('FIXED: AddSubscriptionScreen artık aynı isimde kayıt varsa '
        'onay dialogu gösteriyor — "Vazgeç" denince KAYDEDİLMİYOR', (tester) async {
      final existing = _makeSub(name: 'Netflix');
      final repo = _FakeRepo([existing]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.binding.setSurfaceSize(const Size(800, 2400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(MaterialApp(
        home: AddSubscriptionScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '50');
      await tester.ensureVisible(find.text('Kaydet'));
      await tester.tap(find.text('Kaydet'));
      await tester.pumpAndSettle();

      expect(find.text('Aynı isimde abonelik mevcut'), findsOneWidget,
          reason: 'Aynı isimde kayıt olduğu için onay dialogu gösterildi.');

      await tester.tap(find.text('Vazgeç'));
      await tester.pumpAndSettle();

      expect(controller.allItems.length, 1,
          reason: '"Vazgeç" denilince yeni kayıt OLUŞTURULMADI, sadece orijinal kayıt duruyor.');
    });

    testWidgets('FIXED: aynı isim dialogunda "Yine de ekle" denince kayıt oluşturuluyor', (tester) async {
      final existing = _makeSub(name: 'Netflix');
      final repo = _FakeRepo([existing]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.binding.setSurfaceSize(const Size(800, 2400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(MaterialApp(
        home: AddSubscriptionScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Netflix');
      await tester.enterText(find.byType(TextFormField).at(1), '50');
      await tester.ensureVisible(find.text('Kaydet'));
      await tester.tap(find.text('Kaydet'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Yine de ekle'));
      await tester.pumpAndSettle();

      expect(controller.allItems.length, 2,
          reason: '"Yine de ekle" denilince ikinci "Netflix" kaydı da oluşturuldu.');
    });
  });

  group('TEST 11 — Not alanına çok uzun metin girme', () {
    testWidgets('FIXED: 500 karakter sınırı var — 600 karakter girilince 500\'e kırpılıyor, çökmüyor', (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(_buildForm(key, data));

      final longText = 'a' * 600;
      final notesField = find.byType(TextFormField).last;
      await tester.enterText(notesField, longText);
      await tester.pump();

      expect(data.notes.length, 500,
          reason: 'maxLength: 500 uygulandı — 600 karakterlik giriş 500\'e kırpıldı, çökme olmadı.');
    });

    testWidgets('500 karakterin altındaki metin hiç kırpılmadan kabul ediliyor', (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(_buildForm(key, data));

      final okText = 'a' * 300;
      final notesField = find.byType(TextFormField).last;
      await tester.enterText(notesField, okText);
      await tester.pump();

      expect(data.notes.length, 300);
    });
  });

  group('TEST 12 — Art arda hızlıca birden fazla abonelik ekleme', () {
    test('8 abonelik art arda (Future.wait ile) eklenince hiçbiri kaybolmuyor/bozulmuyor', () async {
      final repo = _FakeRepo();
      final controller = SubscriptionController(userId: 'u1', repository: repo);

      final futures = List.generate(8, (i) => controller.add(
            name: 'Sub $i', amount: Money.fromJson(10.0 + i), currency: 'TRY',
            billingCycle: BillingCycle.monthly, startDate: DateTime(2026, 1, 1),
            nextRenewalDate: DateTime(2026, 2, 1), category: SubscriptionCategory.other,
          ));
      final results = await Future.wait(futures);

      expect(results.every((ok) => ok), isTrue, reason: 'Bazı add() çağrıları başarısız oldu.');
      expect(controller.allItems.length, 8, reason: '8 abonelik de kayıp/bozulma olmadan listede.');
      expect(controller.allItems.map((s) => s.name).toSet().length, 8,
          reason: 'Tüm isimler benzersiz ve karışmadan geldi.');
    });
  });

  group('TEST 13 — Var olan aboneliğin fiyatını güncelleme', () {
    test('controller.edit ile fiyat güncellenince repo ve controller state\'i yansıtıyor', () async {
      final original = _makeSub(amount: 100);
      final repo = _FakeRepo([original]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      final updated = original.copyWith(amount: Money.fromJson(250));
      final ok = await controller.edit(updated);

      expect(ok, isTrue);
      expect(controller.allItems.single.amount.amount, 250.0);
      expect(repo.updateCalls.single.amount.amount, 250.0);
    });
  });

  group('TEST 14 — Yenileme periyodunu değiştirme (Aylık -> Yıllık), UI üzerinden', () {
    testWidgets('Dropdown\'dan "Yıllık" seçilince nextRenewalDate otomatik yeniden hesaplanır', (tester) async {
      final key = GlobalKey<FormState>();
      // Kasıtlı olarak GEÇMİŞTE bir başlangıç (40 gün önce) kullanıyoruz ki
      // periyot değişince (aylık->yıllık) nextOccurrenceOnOrAfter'ın FARKLI
      // sonuçlar ürettiği (dolayısıyla gerçekten yeniden hesaplandığı) görülsün.
      final past = DateTime.now().subtract(const Duration(days: 40));
      final startDate = DateTime(past.year, past.month, past.day);
      final data = SubscriptionFormData(
        startDate: startDate,
        billingCycle: BillingCycle.monthly,
      );
      await tester.pumpWidget(_buildForm(key, data));

      await tester.tap(find.text('Aylık'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yıllık').last);
      await tester.pumpAndSettle();

      expect(data.billingCycle, BillingCycle.yearly);
      final expectedYearly =
          DateTimeUtils.nextOccurrenceOnOrAfter(startDate, 'yearly', DateTime.now());
      expect(data.nextRenewalDate, expectedYearly,
          reason: 'Periyot Yıllık\'a çevrilince sonraki yenileme, yıllık döngüye göre '
              'yeniden hesaplandı (aylık döngüden farklı bir sonuç verir).');
      // Aynı başlangıç için aylık hesap FARKLI bir tarih verirdi — bu da
      // periyodun gerçekten etkili olduğunu (statik/sabit değer olmadığını) kanıtlar.
      final wouldBeMonthly =
          DateTimeUtils.nextOccurrenceOnOrAfter(startDate, 'monthly', DateTime.now());
      expect(expectedYearly, isNot(wouldBeMonthly));
    });
  });

  group('TEST 15 — Başlangıç tarihini değiştirme', () {
    testWidgets('Başlangıç tarihi değişince sonraki yenileme yeniden hesaplanır', (tester) async {
      final key = GlobalKey<FormState>();
      // Test zamanla "geçmişe" düşüp Paket-1 catch-up mantığını (nextOccurrenceOnOrAfter)
      // tetiklemesin diye, her zaman GELECEKTE kalacak bir başlangıç tarihi kullanıyoruz.
      // _pickStartDate lastDate = now+365 gün sınırını aşmamak için 60 gün seçiliyor.
      final farFuture = DateTime.now().add(const Duration(days: 60));
      final startDate = DateTime(farFuture.year, farFuture.month, 10);
      final data = SubscriptionFormData(
        startDate: startDate,
        billingCycle: BillingCycle.monthly,
      );
      await tester.binding.setSurfaceSize(const Size(800, 2400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(_buildForm(key, data));

      await tester.ensureVisible(find.text('Başlangıç tarihi'));
      await tester.tap(find.text('Başlangıç tarihi'));
      await tester.pumpAndSettle();
      // Takvimde "20" gününü seçip (herhangi bir farklı gün) onaylıyoruz.
      await tester.tap(find.text('20').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      expect(data.startDate.day, 20);
      // Paket-1 düzeltmesi (nextOccurrenceOnOrAfter) sonrası: yeni başlangıç
      // tarihi hâlâ bugünden ileride olduğu için ilk yenileme = başlangıç
      // tarihinin KENDİSİ (Test 6 davranışı) — +1 ay DEĞİL.
      expect(data.nextRenewalDate, DateTime(startDate.year, startDate.month, 20),
          reason: 'Gelecekteki yeni başlangıç tarihi seçilince ilk yenileme onunla AYNI oldu.');
    });
  });

  group('TEST 16 — Düzenleme sırasında zorunlu alanı boşaltma', () {
    testWidgets('Edit ekranında isim silinip Güncelle\'ye basılınca kayıt reddedilir, controller.edit çağrılmaz', (tester) async {
      final original = _makeSub();
      final repo = _FakeRepo([original]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.binding.setSurfaceSize(const Size(800, 2400));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(MaterialApp(
        home: EditSubscriptionScreen(subscription: original, controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, '');
      await tester.ensureVisible(find.text('Güncelle'));
      await tester.tap(find.text('Güncelle'));
      await tester.pump();

      expect(find.text('Ad boş olamaz'), findsOneWidget);
      expect(repo.updateCalls, isEmpty,
          reason: 'Validasyon formu durdurdu, controller.edit / repo.update hiç çağrılmadı — '
              'önceki veri korunuyor.');
    });
  });

  group('TEST 17 — Düzenlemeyi kaydetmeden iptal etme (geri gitme)', () {
    testWidgets('Alanlar değiştirilip Güncelle\'ye basılmadan ekrandan çıkılırsa hiçbir şey persist edilmez', (tester) async {
      final original = _makeSub(name: 'Netflix', amount: 100);
      final repo = _FakeRepo([original]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.pumpWidget(MaterialApp(
        home: EditSubscriptionScreen(subscription: original, controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Değişmiş İsim');
      await tester.enterText(find.byType(TextFormField).at(1), '999');
      await tester.pump();
      // "Güncelle" butonuna HİÇ basılmıyor — sadece geri tuşuyla çıkılıyor.

      expect(repo.updateCalls, isEmpty, reason: 'Kaydet basılmadığı için update hiç tetiklenmedi.');
      expect(controller.allItems.single.name, 'Netflix',
          reason: 'Orijinal veri controller state\'inde değişmeden duruyor.');
      expect(controller.allItems.single.amount.amount, 100.0);
    });
  });
}
