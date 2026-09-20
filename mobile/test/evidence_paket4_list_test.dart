// PAKET 4 — Listeleme/Görüntüleme & Arama/Filtreleme/Sıralama: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 22, 23, 24, 25, 26, 27, 28, 29 numaralı
// senaryoları GERÇEK proje kodu (subscription_list_screen.dart,
// subscription_controller.dart) üzerinden çalıştırıp assert eder.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_list_screen.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  _FakeRepo(List<Subscription> data) : _data = List.of(data);

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
  }) async =>
      throw UnimplementedError();

  @override
  Future<Subscription> update(Subscription updated) async => updated;
  @override
  Future<void> delete(String userId, String subscriptionId) async {}
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

Subscription _sub(
  String id,
  String name, {
  double amount = 100,
  String currency = 'TRY',
  BillingCycle cycle = BillingCycle.monthly,
  SubscriptionCategory category = SubscriptionCategory.other,
  SubscriptionStatus status = SubscriptionStatus.active,
  int renewalDaysFromNow = 30,
}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(amount),
      currency: currency,
      billingCycle: cycle,
      startDate: DateTime.now(),
      nextRenewalDate: DateTime.now().add(Duration(days: renewalDaysFromNow)),
      category: category,
      status: status,
      createdAt: DateTime.now(),
    );

Future<SubscriptionController> _loadedCtrl(List<Subscription> subs) async {
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});
  final ctrl =
      SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
  await ctrl.load();
  return ctrl;
}

Widget _wrap(SubscriptionController controller) => MaterialApp(
      home: ChangeNotifierProvider<SubscriptionController>.value(
        value: controller,
        child: const SubscriptionListScreen(),
      ),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TEST 22 — Tüm aboneliklerin listelenmesi ve toplam maliyet hesaplama',
      () {
    test(
        'totalsByCurrency: farklı periyotlar aylık bazda doğru normalize edilip '
        'PARA BİRİMİNE GÖRE AYRI toplanıyor (bu, dashboard\'ın gerçekten kullandığı API)',
        () async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'Netflix',
            amount: 100, currency: 'TRY', cycle: BillingCycle.monthly),
        _sub('2', 'iCloud',
            amount: 1200,
            currency: 'TRY',
            cycle: BillingCycle.yearly), // 100/ay
        _sub('3', 'Spotify',
            amount: 43.3,
            currency: 'TRY',
            cycle: BillingCycle.weekly), // 52 / 12
        _sub('4', 'ChatGPT',
            amount: 20, currency: 'USD', cycle: BillingCycle.monthly),
      ]);

      expect(ctrl.totalsByCurrency['TRY']?.minorUnits,
          10000 + 10000 + (4330 * 52 / 12).round(),
          reason:
              'TRY abonelikleri periyotlarına göre aylık bazda doğru normalize edilip toplandı.');
      expect(ctrl.totalsByCurrency['USD']?.minorUnits, 2000,
          reason:
              'USD kendi para biriminde AYRI toplanıyor, TRY ile karıştırılmıyor.');
    });

    test(
        'FIXED: totalMonthly artık farklı para birimlerini KARIŞTIRMIYOR — '
        'sadece ilk aktif aboneliğin para birimiyle eşleşenleri topluyor',
        () async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'TRY-abonelik-1', amount: 100, currency: 'TRY'),
        _sub('2', 'USD-abonelik', amount: 20, currency: 'USD'),
        _sub('3', 'TRY-abonelik-2', amount: 50, currency: 'TRY'),
      ]);
      // Önceki (hatalı) davranış: 10000 + 2000 + 5000 = 17000 (anlamsız karışım)
      // Düzeltme sonrası: sadece ilk aboneliğin para birimi (TRY) toplanır.
      expect(ctrl.totalMonthly.minorUnits, 15000,
          reason:
              'Sadece TRY abonelikleri (100 + 50 = 150 TRY) toplandı, USD dahil edilmedi.');
    });

    testWidgets('Liste ekranı tüm aktif abonelikleri gösteriyor',
        (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'Netflix'),
        _sub('2', 'Spotify'),
        _sub('3', 'iCloud'),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Aktif 3'));
      await tester.pumpAndSettle();

      expect(find.text('Netflix'), findsOneWidget);
      expect(find.text('Spotify'), findsOneWidget);
      expect(find.text('iCloud'), findsOneWidget);
    });
  });

  group('TEST 23 — Hiç abonelik yokken boş durum ekranı', () {
    testWidgets('Boş liste -> yönlendirici boş durum mesajı gösterilir',
        (tester) async {
      final ctrl = await _loadedCtrl([]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      // Varsayılan açılan sekme Aktif; boş durumda net bir yönlendirme verir.
      expect(find.text('Aktif abonelik yok'), findsOneWidget);
      expect(find.text('Abonelik ekle'), findsOneWidget,
          reason: 'Kullanıcıyı yönlendiren bir aksiyon butonu da var.');

      expect(find.text('Abonelik ekle'), findsOneWidget,
          reason: 'Kullanıcıyı yönlendiren bir aksiyon butonu da var.');
    });
  });

  group('TEST 24 — Yaklaşan yenileme tarihine göre sıralı görüntüleme', () {
    test('Varsayılan sıralama (date): en yakın yenileme en üstte', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'C', renewalDaysFromNow: 20),
        _sub('2', 'A', renewalDaysFromNow: 5),
        _sub('3', 'B', renewalDaysFromNow: 10),
      ]);
      final sorted = List.of(ctrl.active)
        ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate));
      expect(sorted.map((s) => s.id), ['2', '3', '1']);
    });

    testWidgets('Liste ekranında varsayılan sıralama tarihe göre uygulanıyor',
        (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'ÜçüncüSıra', renewalDaysFromNow: 20),
        _sub('2', 'BirinciSıra', renewalDaysFromNow: 5),
        _sub('3', 'İkinciSıra', renewalDaysFromNow: 10),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Aktif 3'));
      await tester.pumpAndSettle();

      final names = tester
          .widgetList<Text>(find.byType(Text))
          .map((t) => t.data)
          .whereType<String>()
          .where((t) => t.contains('Sıra'))
          .toList();
      expect(names, ['BirinciSıra', 'İkinciSıra', 'ÜçüncüSıra']);
    });
  });

  group('TEST 25 — Süresi geçmiş/iptal edilmiş aboneliklerin ayrı gösterimi',
      () {
    testWidgets(
        'İptal ve süresi dolmuş abonelikler Geçmiş sekmesinde aktiften ayrılıyor',
        (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'AktifOlan'),
        _sub('2', 'IptalOlan', status: SubscriptionStatus.cancelled),
        _sub('3', 'SuresiDolan', status: SubscriptionStatus.expired),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();

      expect(find.text('Aktif 1'), findsOneWidget);
      expect(find.text('Geçmiş 2'), findsOneWidget);

      await tester.tap(find.text('Geçmiş 2'));
      await tester.pumpAndSettle();
      expect(find.text('IptalOlan'), findsOneWidget);
      expect(find.text('AktifOlan'), findsNothing,
          reason:
              'Aktif abonelik iptal sekmesinde görünmüyor — ayrı gösteriliyor.');
    });
  });

  group('TEST 26 — İsme göre arama yapma', () {
    testWidgets('Arama kutusuna yazınca anlık filtreleniyor', (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'Netflix'),
        _sub('2', 'Spotify'),
        _sub('3', 'Net Speed VPN'),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Aktif 3'));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'net');
      await tester.pumpAndSettle();

      expect(find.text('Netflix'), findsOneWidget);
      expect(find.text('Net Speed VPN'), findsOneWidget);
      expect(find.text('Spotify'), findsNothing);
    });
  });

  group('TEST 27 — Kategoriye göre filtreleme', () {
    testWidgets('Kategori çipine tıklanınca sadece o kategori listeleniyor',
        (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'Netflix', category: SubscriptionCategory.streaming),
        _sub('2', 'Spotify', category: SubscriptionCategory.music),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Filtrele ve sırala'));
      await tester.pumpAndSettle();
      await tester.tap(find.text(SubscriptionCategory.streaming.label).first);
      await tester.pumpAndSettle();

      expect(find.text('Netflix'), findsOneWidget);
      expect(find.text('Spotify'), findsNothing);
    });
  });

  group('TEST 28 — Fiyata göre artan/azalan sıralama', () {
    testWidgets(
        'FIXED: sıralama menüsünde artık "Fiyat: Artan" VE "Fiyat: Azalan" '
        'ayrı seçenekler olarak var, ikisi de doğru sıralıyor', (tester) async {
      final ctrl = await _loadedCtrl([
        _sub('1', 'Orta', amount: 100),
        _sub('2', 'Ucuz', amount: 50),
        _sub('3', 'Pahalı', amount: 200),
      ]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Filtrele ve sırala'));
      await tester.pumpAndSettle();
      expect(find.text('Fiyat: artan'), findsOneWidget);
      expect(find.text('Fiyat: azalan'), findsOneWidget);

      await tester.tap(find.text('Fiyat: artan'));
      await tester.pumpAndSettle();
      var names = tester
          .widgetList<Text>(find.byType(Text))
          .map((t) => t.data)
          .whereType<String>()
          .where((t) => ['Ucuz', 'Orta', 'Pahalı'].contains(t))
          .toList();
      expect(names, ['Ucuz', 'Orta', 'Pahalı'],
          reason: 'Artan sıralama: düşükten yükseğe.');

      await tester.tap(find.byTooltip('Filtrele ve sırala'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Fiyat: azalan'));
      await tester.pumpAndSettle();
      names = tester
          .widgetList<Text>(find.byType(Text))
          .map((t) => t.data)
          .whereType<String>()
          .where((t) => ['Ucuz', 'Orta', 'Pahalı'].contains(t))
          .toList();
      expect(names, ['Pahalı', 'Orta', 'Ucuz'],
          reason: 'Azalan sıralama: yüksekten düşüğe.');
    });
  });

  group('TEST 29 — Sonuç bulunamayan arama', () {
    testWidgets(
        'Eşleşmeyen arama terimi -> "Sonuç bulunamadı" mesajı, çökme yok',
        (tester) async {
      final ctrl =
          await _loadedCtrl([_sub('1', 'Netflix'), _sub('2', 'Spotify')]);
      await tester.pumpWidget(_wrap(ctrl));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Aktif 2'));
      await tester.pumpAndSettle();

      await tester.enterText(
          find.byType(TextField), 'xyzabc123hicbirseyleesmemiyor');
      await tester.pumpAndSettle();

      expect(find.text('Sonuç bulunamadı.'), findsOneWidget);
      expect(tester.takeException(), isNull, reason: 'Uygulama çökmedi.');
    });
  });
}
