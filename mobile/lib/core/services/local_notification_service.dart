import 'package:flutter/foundation.dart' show kIsWeb, visibleForTesting;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../../features/subscriptions/domain/subscription_models.dart';
import '../../features/notifications/domain/notification_rule.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static const _channelId = 'subscripttrack_renewals';
  static const _channelName = 'Yenileme Hatırlatmaları';
  static const _snoozeActionId = 'snooze_reminder';
  static const _snoozeCategoryId = 'renewal_reminder_category';
  static const snoozeDuration = Duration(minutes: 30);

  /// Hash of the last schedule call — avoids redundant cancels+reschedules.
  static int? _lastScheduleHash;
  static String? _deviceTimezone;

  /// iOS, aynı anda en fazla 64 bekleyen yerel bildirime izin verir (bunun
  /// üzerinde OS sessizce eski/rastgele bildirimleri düşürür). Android'de
  /// resmi bir sabit sayı yoktur ama çok sayıda "exact alarm" pil/performans
  /// sorunu yaratır. Bu yüzden platformdan bağımsız GÜVENLİ bir üst sınır
  /// uyguluyoruz (Test 57).
  static const maxScheduledNotifications = 60;

  /// Bildirime dokunulunca (payload = abonelik id'si) tetiklenir.
  /// AuthenticatedShell bunu dinleyip ilgili detay ekranına yönlendirir (Test 35).
  static void Function(String subscriptionId)? onNotificationTap;

  /// Bildirimdeki "Ertele" aksiyonuna basılınca (payload = abonelik id'si)
  /// tetiklenir. AuthenticatedShell bunu dinleyip [snooze]'u çağırır (Test 36).
  static void Function(String subscriptionId)? onSnoozeRequested;

  static Future<void> initialize() async {
    if (_initialized) return;
    tz.initializeTimeZones();
    await refreshDeviceLocalTimezone();

    const android = AndroidInitializationSettings('@drawable/ic_stat_notify');
    final ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
      notificationCategories: [
        DarwinNotificationCategory(
          _snoozeCategoryId,
          actions: [
            DarwinNotificationAction.plain(_snoozeActionId, 'Ertele'),
          ],
        ),
      ],
    );

    await _plugin.initialize(
      InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: _handleNotificationResponse,
    );
    _initialized = true;
  }

  static void _handleNotificationResponse(NotificationResponse response) {
    _dispatchNotificationResponse(
      payload: response.payload,
      actionId: response.actionId,
    );
  }

  static void _dispatchNotificationResponse({
    required String? payload,
    required String? actionId,
  }) {
    final subscriptionId = payload;
    if (subscriptionId == null || subscriptionId.isEmpty) return;
    if (actionId == _snoozeActionId) {
      onSnoozeRequested?.call(subscriptionId);
    } else {
      onNotificationTap?.call(subscriptionId);
    }
  }

  @visibleForTesting
  static void dispatchNotificationResponseForTesting({
    String? payload,
    String? actionId,
  }) =>
      _dispatchNotificationResponse(payload: payload, actionId: actionId);

  /// Uygulama SIFIRDAN (cold start) bir bildirime dokunularak açıldıysa,
  /// ilgili aboneliğin id'sini döner — aksi halde null. AuthenticatedShell
  /// ilk frame sonrası bunu kontrol edip yönlendirme yapar (Test 35).
  static Future<String?> getLaunchNotificationSubscriptionId() async {
    if (kIsWeb || !_initialized) return null;
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp != true) return null;
    return details?.notificationResponse?.payload;
  }

  /// Bildirim izninin şu an fiilen açık olup olmadığını (kullanıcıya SORMADAN)
  /// kontrol eder. Abonelik eklerken proaktif uyarı göstermek için kullanılır
  /// (Test 37) — [requestPermission] gibi bir izin isteği DİYALOĞU açmaz.
  static Future<bool> arePermissionsGranted() async {
    if (kIsWeb || !_initialized) return true;
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      return await android.areNotificationsEnabled() ?? true;
    }
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      final perms = await ios.checkPermissions();
      return perms?.isEnabled ?? true;
    }
    return true;
  }

  /// `tz.local`, `tz.setLocalLocation()` çağrılmadığı sürece paketin kendi
  /// varsayılanı olan UTC'de kalır — cihazın gerçek saat dilimini YANSITMAZ.
  /// Bu çağrı olmadan "09:00'da hatırlat" gibi zamanlanmış bildirimler,
  /// UTC'den farklı bir dilimdeki (ör. Türkiye, UTC+3) kullanıcılar için
  /// saatlerce kaymış olarak tetiklenir (Test 41).
  /// Cihazın IANA saat dilimini yeniden okur. Değiştiyse eski planlama
  /// parmak izi geçersiz sayılır; bir sonraki schedule çağrısı bildirimleri
  /// yeni yerel saat için yeniden kurar.
  static Future<bool> refreshDeviceLocalTimezone() async {
    if (kIsWeb) return false;
    try {
      final deviceTimezone = await FlutterTimezone.getLocalTimezone();
      if (deviceTimezone == _deviceTimezone) return false;
      tz.setLocalLocation(tz.getLocation(deviceTimezone));
      _deviceTimezone = deviceTimezone;
      _lastScheduleHash = null;
      return true;
    } catch (_) {
      // Cihaz saat dilimi okunamazsa UTC'de kalınır (mevcut güvenli varsayılan).
      return false;
    }
  }

  static Future<bool> requestPermission() async {
    if (kIsWeb) return false;
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      return await android.requestNotificationsPermission() ?? false;
    }
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      return await ios.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          ) ??
          false;
    }
    return false;
  }

  /// [timezone] boş string ise cihaz yerel saat dilimi kullanılır.
  static Future<void> scheduleRenewalReminders(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
  }) async {
    if (kIsWeb || !_initialized) return;
    final scheduleMode = await _androidScheduleMode();
    // Deduplicate: skip reschedule if inputs haven't changed.
    final hash = scheduleFingerprint(
      subscriptions,
      daysBefore,
      timezone: timezone,
      trials: trials,
      rules: rules,
    );
    if (hash == _lastScheduleHash) return;
    _lastScheduleHash = hash;

    await _plugin.cancelAll();
    final location = timezone.isNotEmpty ? tz.getLocation(timezone) : tz.local;
    final now = tz.TZDateTime.now(location);

    final candidates = <_PendingReminder>[];

    for (final sub in subscriptions) {
      final configuredRules =
          sub.notificationRules.isNotEmpty ? sub.notificationRules : rules;
      final renewalDays = configuredRules.isEmpty
          ? [daysBefore]
          : configuredRules
              .where((r) => r.enabled)
              .map((r) => r.daysBefore)
              .toSet()
              .toList()
        ..sort();
      for (final reminderDaysBefore in renewalDays) {
        final reminderDay =
            sub.nextRenewalDate.subtract(Duration(days: reminderDaysBefore));
        final scheduled = tz.TZDateTime(
          location,
          reminderDay.year,
          reminderDay.month,
          reminderDay.day,
          9, // 09:00
        );

        if (scheduled.isBefore(now)) continue;

        final body = reminderDaysBefore == 0
            ? 'Bugün yenileniyor — ${sub.amount.amount} ${sub.currency}'
            : '$reminderDaysBefore gün içinde yenileniyor — ${sub.amount.amount} ${sub.currency}';

        // Composite key: sub.id + daysBefore + tarih → çakışmayı engeller
        final dateKey =
            '${reminderDay.year}${reminderDay.month.toString().padLeft(2, '0')}${reminderDay.day.toString().padLeft(2, '0')}';
        final stableNotifId =
            '${sub.id}|$reminderDaysBefore|$dateKey'.hashCode.abs() %
                2147483647;

        candidates.add(_PendingReminder(
          id: stableNotifId,
          title: sub.name,
          body: body,
          scheduled: scheduled,
          channelDescription: 'Abonelik yenileme bildirimleri',
          payload: sub.id,
        ));
      }
    }

    for (final sub in trials) {
      final end = sub.trialEndDate?.toLocal();
      if (end == null) continue;
      for (final days in const [7, 3, 1]) {
        final reminder = end.subtract(Duration(days: days));
        final scheduled = tz.TZDateTime(
            location, reminder.year, reminder.month, reminder.day, 9);
        if (scheduled.isBefore(now)) continue;
        final dateKey =
            '${end.year}${end.month.toString().padLeft(2, '0')}${end.day.toString().padLeft(2, '0')}';
        final id = '${sub.id}|trial|$days|$dateKey'.hashCode.abs() % 2147483647;

        candidates.add(_PendingReminder(
          id: id,
          title: '${sub.name} trial bitişi',
          body: 'Trial süresinin bitmesine $days gün kaldı.',
          scheduled: scheduled,
          channelDescription: 'Trial ve yenileme hatırlatmaları',
          payload: sub.id,
        ));
      }
    }

    // Test 57: OS bildirim limitlerini aşmamak için, EN YAKIN (en öncelikli)
    // hatırlatmaları koruyup geri kalanını atıyoruz — sessizce/rastgele
    // düşürülmelerine izin vermek yerine bilinçli bir öncelik sırası.
    candidates.sort((a, b) => a.scheduled.compareTo(b.scheduled));
    final toSchedule = candidates.length > maxScheduledNotifications
        ? candidates.sublist(0, maxScheduledNotifications)
        : candidates;

    for (final reminder in toSchedule) {
      await _plugin.zonedSchedule(
        reminder.id,
        reminder.title,
        reminder.body,
        reminder.scheduled,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: reminder.channelDescription,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            actions: const [
              AndroidNotificationAction(_snoozeActionId, 'Ertele'),
            ],
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
            categoryIdentifier: _snoozeCategoryId,
          ),
        ),
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        androidScheduleMode: scheduleMode,
        // Test 35: bildirime dokununca hangi aboneliğe gidileceğini taşır.
        payload: reminder.payload,
      );
    }
  }

  /// Bildirimin içeriğini veya zamanını etkileyen bir alan değiştiğinde yeni
  /// bir planlama yapılmasını sağlar. Platform çağrısı olmadan test edilebilir.
  @visibleForTesting
  static int scheduleFingerprint(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
  }) =>
      Object.hashAll([
        daysBefore,
        timezone,
        ...rules.expand((r) => [r.daysBefore, r.enabled]),
        ...subscriptions.expand(
          (s) => [
            s.id,
            s.name,
            s.amount.minorUnits,
            s.currency,
            s.nextRenewalDate.millisecondsSinceEpoch,
            s.status.index,
            ...s.notificationRules.expand((r) => [r.daysBefore, r.enabled]),
          ],
        ),
        ...trials.expand(
          (s) => [
            s.id,
            s.name,
            s.amount.minorUnits,
            s.currency,
            s.trialEndDate?.millisecondsSinceEpoch,
            s.status.index,
          ],
        ),
      ]);

  /// Bildirimdeki "Ertele" aksiyonuna basılınca çağrılır (Test 36):
  /// [sub] için [snoozeDuration] sonra tek seferlik bir hatırlatma bildirimi
  /// tekrar gösterilir. Orijinal id ile aynı `stableNotifId` kullanılmıyor —
  /// bu kasıtlı olarak YENİ bir bildirim, orijinal zamanlanmış hatırlatmanın
  /// yerini almaz (o da mevcut kalır).
  static Future<void> snooze(Subscription sub, {Duration? duration}) async {
    if (kIsWeb || !_initialized) return;
    final pending = await _plugin.pendingNotificationRequests();
    if (!canScheduleAdditionalNotification(pending.length)) return;
    final scheduleMode = await _androidScheduleMode();
    final wait = duration ?? snoozeDuration;
    final scheduled = tz.TZDateTime.now(tz.local).add(wait);
    final snoozeId =
        '${sub.id}|snooze|${scheduled.millisecondsSinceEpoch}'.hashCode.abs() %
            2147483647;

    await _plugin.zonedSchedule(
      snoozeId,
      sub.name,
      'Ertelenen hatırlatma — ${sub.amount.amount} ${sub.currency}',
      scheduled,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: 'Abonelik yenileme bildirimleri',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      androidScheduleMode: scheduleMode,
      payload: sub.id,
    );
  }

  @visibleForTesting
  static bool canScheduleAdditionalNotification(int pendingCount) =>
      pendingCount < maxScheduledNotifications;

  /// Android 12+ exact-alarm izni verilmemişse, planlamayı başarısız kılmak
  /// yerine OS'nin izin verdiği yakın zamanlı moda düşer. iOS'ta bu ayar
  /// kullanılmadığından exact modu zararsız biçimde korunur.
  static Future<AndroidScheduleMode> _androidScheduleMode() async {
    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android == null) return AndroidScheduleMode.exactAllowWhileIdle;
    final canSchedule = await android.canScheduleExactNotifications();
    return canSchedule == false
        ? AndroidScheduleMode.inexactAllowWhileIdle
        : AndroidScheduleMode.exactAllowWhileIdle;
  }

  static Future<void> sendTestNotification() async {
    await showPushNotification(
      title: 'Test Bildirimi',
      body: 'SubscriptTrack bildirimleri çalışıyor ✓',
    );
  }

  /// Shows an incoming notification while the app is active in the foreground.
  static Future<void> showPushNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (kIsWeb || !_initialized) return;
    await _plugin.show(
      Object.hash(title, body, payload).abs() % 2147483647,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentSound: true,
        ),
      ),
      payload: payload,
    );
  }

  static Future<void> cancelAll() async {
    if (kIsWeb || !_initialized) return;
    await _plugin.cancelAll();
  }

  /// Read-only diagnostic hook used by device acceptance tests.
  static Future<Set<int>> pendingNotificationIds() async {
    if (kIsWeb || !_initialized) return const {};
    final pending = await _plugin.pendingNotificationRequests();
    return pending.map((request) => request.id).toSet();
  }

  /// Cancels every pending notification whose payload belongs to [subscriptionId].
  /// This also removes snoozed reminders, so deleting or archiving a
  /// subscription cannot leave an orphan notification behind.
  static Future<void> cancelForSubscription(String subscriptionId) async {
    if (kIsWeb || !_initialized || subscriptionId.isEmpty) return;
    final pending = await _plugin.pendingNotificationRequests();
    for (final request in pending) {
      if (request.payload == subscriptionId) {
        await _plugin.cancel(request.id);
      }
    }
  }
}

/// Gerçekte planlanmadan önce hesaplanan, saf bir bildirim adayı — sıralama
/// ve sınırlama (Test 57) plugin çağrısından ÖNCE bu düzeyde yapılıyor.
class _PendingReminder {
  const _PendingReminder({
    required this.id,
    required this.title,
    required this.body,
    required this.scheduled,
    required this.channelDescription,
    required this.payload,
  });

  final int id;
  final String title;
  final String body;
  final tz.TZDateTime scheduled;
  final String channelDescription;
  final String payload;
}
