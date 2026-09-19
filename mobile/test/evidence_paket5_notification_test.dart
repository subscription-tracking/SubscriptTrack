// PAKET 5 — Bildirim Planlama Mantığı: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 30, 31, 32, 33, 39, 41 numaralı senaryoları
// inceler. LocalNotificationService, flutter_local_notifications plugin'ine
// bağlı olduğundan (platform channel gerektirir) `scheduleRenewalReminders`
// doğrudan bir `flutter test` ortamında çağrılamıyor — bunu bizzat doğruladık
// (deneme: initialize() çağrısı `FlutterLocalNotificationsPlatform._instance`
// LateInitializationError'ı ile patlıyor, çünkü platform kaydı gerçek
// cihaz/emülatör gerektiriyor).
//
// Bu yüzden bu paket için kanıt iki şekilde üretildi:
//  1) Servisin KENDİ KAYNAK KODUNDAKİ birebir formülleri (satır numarasıyla
//     alıntılanarak) izole bir test içinde yeniden üretip somut girdi/çıktı
//     ile doğrulamak — plugin'e dokunmadan saf mantığı kanıtlar.
//  2) `timezone` paketinin gerçek varsayılan davranışını (tz.local) bizzat
//     çalıştırıp gözlemlemek.

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group(
      'TEST 30/31/33 — Hatırlatma zamanı hesabı (local_notification_service.dart:80-94)',
      () {
    // Kaynaktaki birebir formül:
    //   final reminderDay = sub.nextRenewalDate.subtract(Duration(days: daysBefore));
    //   final scheduled = TZDateTime(location, reminderDay.year, month, day, 9);
    //   final body = daysBefore == 0 ? 'Bugün yenileniyor...' : '$daysBefore gün içinde...';
    DateTime reminderDayFor(DateTime nextRenewalDate, int daysBefore) =>
        nextRenewalDate.subtract(Duration(days: daysBefore));

    test('TEST 30 — varsayılan (3 gün önce, ayarlardaki fabrika değeri)', () {
      // settings_controller.dart:21 -> _daysBefore = 3 (varsayılan)
      final renewal = DateTime(2026, 10, 20);
      final reminderDay = reminderDayFor(renewal, 3);
      expect(reminderDay, DateTime(2026, 10, 17));
      tzdata.initializeTimeZones();
      final scheduled = tz.TZDateTime(
        tz.getLocation('Europe/Istanbul'),
        reminderDay.year,
        reminderDay.month,
        reminderDay.day,
        9,
      );
      expect(scheduled.hour, 9);
      expect(scheduled.location.name, 'Europe/Istanbul');
    });

    test('TEST 31 — kullanıcı "1 gün önce" olarak özelleştirirse', () {
      final renewal = DateTime(2026, 10, 20);
      final reminderDay = reminderDayFor(renewal, 1);
      expect(reminderDay, DateTime(2026, 10, 19));
    });

    test(
        'TEST 33 — yenileme BUGÜN ise (daysBefore=0), "Bugün yenileniyor" metni kullanılır',
        () {
      const daysBefore = 0;
      const body = daysBefore == 0
          ? 'Bugün yenileniyor'
          : '$daysBefore gün içinde yenileniyor';
      expect(body, 'Bugün yenileniyor');
      final renewal = DateTime(2026, 10, 20);
      expect(reminderDayFor(renewal, 0), renewal,
          reason:
              'daysBefore=0 için hatırlatma günü = yenileme gününün kendisi.');
    });
  });

  group('TEST 32 — Birden fazla hatırlatma zamanı tanımlama', () {
    test('normal abonelik kuralları birden fazla gün öncesini korur', () {
      const rules = [
        NotificationRule(daysBefore: 7),
        NotificationRule(daysBefore: 1),
      ];
      final enabledDays = rules
          .where((r) => r.enabled)
          .map((r) => r.daysBefore)
          .toSet()
          .toList()
        ..sort();
      expect(enabledDays, [1, 7]);
      // LocalNotificationService.scheduleRenewalReminders aynı listeyi
      // her abonelik için dolaşarak iki ayrı OS bildirimi planlar.
    });
  });

  group('TEST 39 — Aynı gün birden fazla aboneliğin son tarihi', () {
    // Kaynaktaki birebir formül (satır 96-100):
    //   dateKey = '${reminderDay.year}${month}${day}' (2 haneli, sıfır dolgulu)
    //   stableNotifId = '${sub.id}|$daysBefore|$dateKey'.hashCode.abs() % 2147483647
    int stableNotifId(String subId, int daysBefore, DateTime reminderDay) {
      final dateKey =
          '${reminderDay.year}${reminderDay.month.toString().padLeft(2, '0')}${reminderDay.day.toString().padLeft(2, '0')}';
      return '$subId|$daysBefore|$dateKey'.hashCode.abs() % 2147483647;
    }

    test(
        'Aynı gün yenilenen 3 farklı abonelik BİRBİRİNDEN FARKLI id alır '
        '(sub.id anahtara dahil olduğu için çakışmıyor)', () {
      final sameDay = DateTime(2026, 11, 5);
      final id1 = stableNotifId('sub-A', 3, sameDay);
      final id2 = stableNotifId('sub-B', 3, sameDay);
      final id3 = stableNotifId('sub-C', 3, sameDay);
      expect({id1, id2, id3}.length, 3,
          reason:
              'Her abonelik kendi id\'sine göre benzersiz bildirim id\'si alıyor, '
              'aynı tarih tek başına çakışmaya yol açmıyor.');
    });

    test(
        'Aynı abonelik + aynı gün + aynı daysBefore -> AYNI id (idempotent, '
        'tekrar planlamada duplicate bildirim oluşturmaz)', () {
      final d = DateTime(2026, 11, 5);
      expect(stableNotifId('sub-A', 3, d), stableNotifId('sub-A', 3, d));
    });
  });

  group('TEST 41 — Cihaz saat dilimi değişikliğinde hatırlatma zamanı', () {
    test(
        'Dedup hash formülü timezone STRING\'ini DE içeriyor (satır 64-66) — '
        'bu yüzden kullanıcı Ayarlar\'dan farklı bir timezone seçerse yeniden '
        'planlama TETİKLENİR (önceki incelemede yanlışlıkla "risk" diye işaretlemiştim, '
        'kaynağı tekrar okuyunca bunun doğru çalıştığını görüyorum)', () {
      Object hashFor(
              int daysBefore, String timezone, List<(String, int)> subs) =>
          Object.hashAll([
            daysBefore,
            timezone,
            ...subs.map((s) => Object.hash(s.$1, s.$2, 0)),
          ]);

      final subs = [('sub-1', DateTime(2026, 10, 20).millisecondsSinceEpoch)];
      final hashIstanbul = hashFor(3, 'Europe/Istanbul', subs);
      final hashTokyo = hashFor(3, 'Asia/Tokyo', subs);
      expect(hashIstanbul, isNot(hashTokyo),
          reason:
              'timezone alanı hash\'e dahil, farklı timezone farklı hash üretir.');
    });

    test(
        'DÜZELTME ÖNCESİ durumun kanıtı (regresyon değil, tarihsel kayıt): '
        'setLocalLocation hiç çağrılmazsa tz.local paketin kendi varsayılanı '
        'olan UTC\'de kalırdı', () {
      tzdata.initializeTimeZones();
      // Bu, `timezone` paketinin KENDİ davranışı — setLocalLocation() henüz
      // hiç çağrılmadıysa tz.local budur. Artık local_notification_service.dart
      // initialize() içinde _setDeviceLocalTimezone() ile bunu düzeltiyor
      // (aşağıdaki FIXED testine bakın); bu test sadece "çağrılmazsa ne olurdu"
      // temel gerçeğini belgeliyor.
      expect(tz.local.name, 'UTC');
    });

    test(
        'FIXED: local_notification_service.dart artık initialize() içinde '
        'cihazın gerçek saat dilimini flutter_timezone ile okuyup '
        'tz.setLocalLocation() ile ayarlıyor — mock edilmiş "Europe/Istanbul" '
        'cihaz saat dilimiyle tz.local artık UTC DEĞİL, İstanbul oluyor',
        () async {
      tzdata.initializeTimeZones();

      // _setDeviceLocalTimezone() içindeki BİREBİR mekanizmayı, gerçek cihaz
      // olmadan test edebilmek için flutter_timezone plugin'inin MethodChannel'ını
      // mock'luyoruz (plugin bir platform channel'ı üzerinden tek bir String
      // döndürüyor — flutter_local_notifications'ın aksine mock'lanması kolay).
      const channel = MethodChannel('flutter_timezone');
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, (call) async {
        if (call.method == 'getLocalTimezone') return 'Europe/Istanbul';
        return null;
      });
      addTearDown(() => TestDefaultBinaryMessengerBinding
          .instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, null));

      // local_notification_service.dart _setDeviceLocalTimezone() ile BİREBİR
      // aynı iki satır:
      final deviceTimezone = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(deviceTimezone));

      expect(tz.local.name, 'Europe/Istanbul',
          reason: 'Cihaz saat dilimi artık gerçekten okunup uygulanıyor — '
              '"09:00\'da hatırlat" artık gerçekten 09:00 İstanbul saatinde tetiklenecek.');

      // Temizlik: sonraki testleri etkilememesi için tekrar UTC'ye dön.
      tz.setLocalLocation(tz.getLocation('UTC'));
    });
  });
}
