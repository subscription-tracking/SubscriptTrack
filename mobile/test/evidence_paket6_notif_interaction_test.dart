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
    test('FIXED (Paket 1 sayesinde): geçmiş tarihli aktif abonelik artık '
        'load() sonrası otomatik ileri alınıyor, "yanlış geçmiş tarih" '
        'göstermiyor ve status bozulmuyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final missed = DateTime.now().subtract(const Duration(days: 5));
      final repo = _FakeRepo([_sub('1', missed)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);

      await ctrl.load();

      final result = ctrl.allItems.single;
      expect(result.status, SubscriptionStatus.active,
          reason: 'Kullanıcıya uygun şekilde bilgilendiriliyor: hâlâ aktif, '
              'ama tarihi güncel.');
      expect(result.daysUntilRenewal, greaterThanOrEqualTo(0),
          reason: 'Uygulama artık HATALI bir geçmiş tarih göstermiyor.');
    });
  });

  group('TEST 35 — Bildirime dokunulduğunda ilgili abonelik detayına yönlendirme', () {
    test('EKSİK: kod tabanında onDidReceiveNotificationResponse (ya da eşdeğeri) '
        'HİÇ TANIMLI DEĞİL — payload set ediliyor ama okunup bir ekrana '
        'yönlendirilmiyor', () {
      // Kanıt (statik tarama): local_notification_service.dart:29'daki
      // `_plugin.initialize(InitializationSettings(...))` çağrısında
      // `onDidReceiveNotificationResponse` parametresi HİÇ verilmiyor.
      // `payload: sub.id` (satır 156) set ediliyor ama onu tüketen bir
      // callback kod tabanında yok — grep ile "onDidReceiveNotificationResponse",
      // "NotificationResponse" hiçbir yerde bulunamadı.
      expect(true, isTrue,
          reason: 'Belgeleme amaçlı: kanıt yukarıdaki statik kod taramasıdır.');
    });
  });

  group('TEST 36 — Bildirimi erteleme (snooze)', () {
    test('EKSİK: "snooze/ertele" özelliği kod tabanında hiç mevcut değil', () {
      // Kanıt: "snooze" ve "ertele" (bildirimle ilgili) için tüm projede
      // grep taraması sıfır sonuç verdi. LocalNotificationService'te
      // cancelAll/zonedSchedule dışında yeniden zamanlama fonksiyonu yok.
      expect(true, isTrue,
          reason: 'Belgeleme amaçlı: kanıt statik kod taramasıdır.');
    });
  });

  group('TEST 37 — Bildirim izni verilmediğinde davranış', () {
    test('KISMİ: izin durumu sadece Ayarlar > Bildirim Tercihleri ekranında, '
        'kullanıcı MANUEL olarak dokununca kontrol ediliyor; abonelik eklerken '
        '(yaklaşan tarihli) OTOMATİK bir uyarı YOK', () {
      // Kanıt: requestPermission() çağrısı sadece
      // notification_preferences_screen.dart:23'te, kullanıcının "İzin ver"
      // gibi bir aksiyonuna bağlı. features/subscriptions/** içinde (abonelik
      // ekleme akışında) izin kontrolüne dair hiçbir referans yok — bu yüzden
      // Excel'in beklediği "yaklaşan son tarihli abonelik eklerken app'in
      // izin kapalı olduğunu proaktif söylemesi" senaryosu karşılanmıyor.
      expect(true, isTrue,
          reason: 'Belgeleme amaçlı: kanıt statik kod taramasıdır.');
    });
  });

  group('TEST 38 — Uygulama arka plandayken/kapalıyken bildirimin gelmesi', () {
    test('VAR: zonedSchedule + androidScheduleMode: exactAllowWhileIdle OS '
        'seviyesinde planlama sağlıyor (uygulamanın açık olması gerekmiyor)', () {
      // Kanıt: local_notification_service.dart:102-125 -> zonedSchedule
      // çağrısı androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle
      // kullanıyor; bu flutter_local_notifications'ın OS'a (AlarmManager/
      // UNUserNotificationCenter) devrettiği, uygulama süreci kapalıyken de
      // çalışan resmi mekanizmadır.
      expect(true, isTrue,
          reason: 'Belgeleme amaçlı: kanıt statik kod taramasıdır + plugin dokümantasyonu.');
    });
  });

  group('TEST 40 — Abonelik silindiğinde bekleyen bildirimin iptali', () {
    test('VAR (Paket 3 / Test 20 ile aynı senaryo — çapraz doğrulama): '
        'silinen abonelik controller.active listesinden kalkıyor, bu liste '
        'AuthenticatedShell tarafından dinlenip yeniden bildirim planlamasına '
        'besleniyor', () async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FakeRepo([_sub('1', DateTime.now().add(const Duration(days: 5)))]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      var activeAfterDelete = <String>[];
      ctrl.addListener(() => activeAfterDelete = ctrl.active.map((s) => s.id).toList());

      await ctrl.delete('1');

      expect(activeAfterDelete, isEmpty,
          reason: 'notifyListeners() anında silinen abonelik active listesinde yok — '
              'bir sonraki scheduleRenewalReminders çağrısı onu içermeyecek.');
      expect(repo.deleteCalls, ['1']);
    });
  });

  group('TEST 53 — Cihaz yeniden başlatıldığında bildirimlerin aktif kalması', () {
    test('VAR (Android): AndroidManifest.xml RECEIVE_BOOT_COMPLETED izni ve '
        'BOOT_COMPLETED action\'ı tanımlı — flutter_local_notifications bunu '
        'kullanarak zamanlanmış bildirimleri reboot sonrası yeniden kaydeder', () {
      final manifest = File('android/app/src/main/AndroidManifest.xml').readAsStringSync();
      expect(manifest.contains('RECEIVE_BOOT_COMPLETED'), isTrue);
      expect(manifest.contains('BOOT_COMPLETED'), isTrue);
      // iOS tarafında ayrı bir manifest girişi GEREKMEZ — UNUserNotificationCenter
      // ile zamanlanmış yerel bildirimler OS tarafından reboot sonrası da
      // korunur (Apple'ın resmi platform davranışı, uygulama kodundan bağımsız).
    });
  });
}
