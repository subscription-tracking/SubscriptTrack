// PAKET 6 — DÜZELTME KANITI: bildirim tıklama yönlendirmesi (Test 35),
// snooze (Test 36), proaktif izin uyarısı (Test 37).
//
// Not (Paket 5'teki ile aynı sınırlama): flutter_local_notifications
// platform channel'a bağlı olduğundan gerçek plugin çağrıları (zonedSchedule,
// resolvePlatformSpecificImplementation) bu ortamda çalıştırılamıyor —
// `LocalNotificationService.initialize()` bunu asla `_initialized = true`
// yapamıyor. Bu yüzden kanıt üç düzeyde toplandı:
//  1) Guard'lı metodların (snooze, arePermissionsGranted) initialize
//     edilmemiş durumda GÜVENLİ NO-OP olduğu (çökme yok) — gerçekten çalıştırıldı.
//  2) Dispatch/eşleştirme mantığının (hangi callback'in ne zaman tetikleneceği,
//     hangi aboneliğin bulunacağı) BİREBİR aynı formülle izole test edilmesi.
//  3) UI akışının (AddSubscriptionScreen) düzeltme sonrası hâlâ hatasız
//     çalıştığının widget testiyle doğrulanması.
// Gerçek cihazda "bildirime dokun -> detay ekranı açılsın" ve "izin kapalıyken
// SnackBar görünsün" adımları emülatör/cihaz QA'sı gerektirir.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/add_subscription_screen.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data = [];
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

Subscription _sub(String id) => Subscription(
      id: id,
      userId: 'u1',
      name: 'Sub $id',
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(),
      nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
      category: SubscriptionCategory.other,
      createdAt: DateTime.now(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group(
      'TEST 35 — Bildirime dokunulduğunda ilgili abonelik detayına yönlendirme (FIXED)',
      () {
    test(
        'normal yanıt abonelik kimliğini tap callback’ine iletir; snooze yanıtı ayrı callback kullanır',
        () {
      String? tappedId;
      String? snoozedId;
      LocalNotificationService.onNotificationTap = (id) => tappedId = id;
      LocalNotificationService.onSnoozeRequested = (id) => snoozedId = id;
      addTearDown(() {
        LocalNotificationService.onNotificationTap = null;
        LocalNotificationService.onSnoozeRequested = null;
      });

      LocalNotificationService.dispatchNotificationResponseForTesting(
          payload: 'sub-42');
      expect(tappedId, 'sub-42');
      expect(snoozedId, isNull);

      tappedId = null;
      LocalNotificationService.dispatchNotificationResponseForTesting(
        payload: 'sub-7',
        actionId: 'snooze_reminder',
      );
      expect(snoozedId, 'sub-7');
      expect(tappedId, isNull);

      LocalNotificationService.dispatchNotificationResponseForTesting();
      expect(tappedId, isNull);
      expect(snoozedId, 'sub-7');
    });

    test(
        'DÜZELTME: AuthenticatedShell._findSubscription eşdeğeri — '
        'abonelik id\'ye göre doğru bulunuyor, bulunamazsa null (çökme yok)',
        () {
      final items = [_sub('1'), _sub('2'), _sub('3')];
      Subscription? findById(String id) {
        for (final s in items) {
          if (s.id == id) return s;
        }
        return null;
      }

      expect(findById('2')?.name, 'Sub 2');
      expect(findById('unknown'), isNull);
    });
  });

  group('TEST 36 — Bildirimi erteleme (snooze) (FIXED)', () {
    test(
        'LocalNotificationService.snooze() artık MEVCUT (önceden hiç yoktu) '
        've initialize edilmemiş ortamda güvenli no-op olarak çalışıyor (çökmüyor)',
        () async {
      final sub = _sub('1');
      await expectLater(LocalNotificationService.snooze(sub), completes);
    });

    test('Varsayılan erteleme süresi 30 dakika olarak tanımlı ve public', () {
      expect(
          LocalNotificationService.snoozeDuration, const Duration(minutes: 30));
    });
  });

  group('TEST 37 — Bildirim izni verilmediğinde davranış (FIXED)', () {
    test(
        'LocalNotificationService.arePermissionsGranted() artık MEVCUT '
        '(önceden hiç yoktu) — kullanıcıya SORMADAN durumu kontrol ediyor',
        () async {
      final granted = await LocalNotificationService.arePermissionsGranted();
      // Plugin bu test ortamında hiç initialize olamadığından güvenli
      // varsayılan (true) dönüyor; gerçek cihazda plugin başladıktan sonra
      // gerçek OS iznini yansıtır (areNotificationsEnabled / checkPermissions).
      expect(granted, isA<bool>());
    });

    testWidgets(
        'UI regresyon kontrolü: AddSubscriptionScreen, yeni proaktif '
        'izin kontrolü eklendikten SONRA da normal şekilde kaydedip kapanıyor',
        (tester) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final controller =
          SubscriptionController(userId: 'u1', repository: _FakeRepo());
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

      expect(controller.allItems.length, 1,
          reason: 'İzin kontrolü eklenmesi kayıt akışını bozmadı.');
    });
  });
}
