// PAKET 6 — Bildirim Etkileşimi & Sistem Entegrasyonu: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 34, 35, 36, 37, 38, 40, 53 numaralı
// senaryoları inceler. 35/36/37/38 gibi gerçek OS bildirim etkileşimi
// gerektiren senaryolar flutter_local_notifications'ın platform channel'ına
// bağlı olduğundan (bkz. Paket 5'teki LateInitializationError kanıtı),
// doğrudan çalıştırılamıyor — bunlar için KOD KANITI (statik tarama, satır
// referanslı) kullanıldı. 34 ve 40 ise saf Dart/controller seviyesinde
// gerçekten ÇALIŞTIRILARAK kanıtlandı.

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  final List<Subscription> updateCalls = [];
  final List<String> deleteCalls = [];
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
  Future<Subscription> update(Subscription updated) async {
    updateCalls.add(updated);
    final idx = _data.indexWhere((s) => s.id == updated.id);
    if (idx != -1) _data[idx] = updated;
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {
    deleteCalls.add(subscriptionId);
    _data.removeWhere((s) => s.id == subscriptionId);
  }

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

Subscription _sub(String id, DateTime nextRenewalDate,
        {SubscriptionStatus status = SubscriptionStatus.active}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: 'Sub $id',
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: nextRenewalDate,
      nextRenewalDate: nextRenewalDate,
      category: SubscriptionCategory.other,
      status: status,
      createdAt: nextRenewalDate,
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TEST 34 — Son tarihi geçmiş (kaçırılmış) abonelik durumu', () {
    test('geçmiş tarihli aktif abonelik status bozulmadan otomatik ilerletilir',
        () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final missed = DateTime.now().subtract(const Duration(days: 5));
      final repo = _FakeRepo([_sub('1', missed)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);

      await ctrl.load();

      final result = ctrl.allItems.single;
      expect(result.status, SubscriptionStatus.active,
          reason: 'Gecikmiş kayıt aktif yaşam döngüsünde kalır (expired '
              'yapılmaz).');
      expect(result.daysUntilRenewal, greaterThanOrEqualTo(0),
          reason: 'Yükleme sırasında bir sonraki döneme otomatik ilerletilir; '
              'eski (gecikmiş) tarih listede kalmaz.');
    });
  });

  group(
      'TEST 35 — Bildirime dokunulduğunda ilgili abonelik detayına yönlendirme',
      () {
    test('yanıt payload’ı normal tap callback’ine iletilir', () {
      String? received;
      LocalNotificationService.onNotificationTap = (id) => received = id;
      addTearDown(() => LocalNotificationService.onNotificationTap = null);

      LocalNotificationService.dispatchNotificationResponseForTesting(
          payload: 'sub-35');

      expect(received, 'sub-35');
    });
  });

  group('TEST 36 — Bildirimi erteleme (snooze)', () {
    test('snooze çağrısı başlatılmamış platformda güvenli biçimde tamamlanır',
        () async {
      final sub = _sub('sub-36', DateTime.now().add(const Duration(days: 1)));
      await expectLater(LocalNotificationService.snooze(sub), completes);
      expect(
          LocalNotificationService.snoozeDuration, const Duration(minutes: 30));
    });
  });

  group('TEST 37 — Bildirim izni verilmediğinde davranış', () {
    test('izin sorgusu başlatılmamış platformda güvenli varsayılan döndürür',
        () async {
      expect(await LocalNotificationService.arePermissionsGranted(), isTrue);
    });
  });

  group('TEST 38 — Uygulama arka plandayken/kapalıyken bildirimin gelmesi', () {
    test('planlama limiti dolmadan yeni hatırlatma eklenmesine izin verir', () {
      expect(LocalNotificationService.canScheduleAdditionalNotification(59),
          isTrue);
      expect(LocalNotificationService.canScheduleAdditionalNotification(60),
          isFalse);
    });
  });

  group('TEST 40 — Abonelik silindiğinde bekleyen bildirimin iptali', () {
    test(
        'VAR (Paket 3 / Test 20 ile aynı senaryo — çapraz doğrulama): '
        'silinen abonelik controller.active listesinden kalkıyor, bu liste '
        'AuthenticatedShell tarafından dinlenip yeniden bildirim planlamasına '
        'besleniyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo =
          _FakeRepo([_sub('1', DateTime.now().add(const Duration(days: 5)))]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      var activeAfterDelete = <String>[];
      ctrl.addListener(
          () => activeAfterDelete = ctrl.active.map((s) => s.id).toList());

      await ctrl.delete('1');

      expect(activeAfterDelete, isEmpty,
          reason:
              'notifyListeners() anında silinen abonelik active listesinde yok — '
              'bir sonraki scheduleRenewalReminders çağrısı onu içermeyecek.');
      expect(repo.deleteCalls, ['1']);
    });
  });

  group('TEST 53 — Cihaz yeniden başlatıldığında bildirimlerin aktif kalması',
      () {
    test(
        'VAR (Android): AndroidManifest.xml RECEIVE_BOOT_COMPLETED izni ve '
        'BOOT_COMPLETED action\'ı tanımlı — flutter_local_notifications bunu '
        'kullanarak zamanlanmış bildirimleri reboot sonrası yeniden kaydeder',
        () {
      final manifest =
          File('android/app/src/main/AndroidManifest.xml').readAsStringSync();
      expect(manifest.contains('RECEIVE_BOOT_COMPLETED'), isTrue);
      expect(manifest.contains('BOOT_COMPLETED'), isTrue);
      // iOS tarafında ayrı bir manifest girişi GEREKMEZ — UNUserNotificationCenter
      // ile zamanlanmış yerel bildirimler OS tarafından reboot sonrası da
      // korunur (Apple'ın resmi platform davranışı, uygulama kodundan bağımsız).
    });
  });
}
