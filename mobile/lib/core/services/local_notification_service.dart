import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../../features/subscriptions/domain/subscription_models.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static const _channelId = 'subscripttrack_renewals';
  static const _channelName = 'Yenileme Hatırlatmaları';

  static Future<void> initialize() async {
    if (_initialized) return;
    tz.initializeTimeZones();

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
    _initialized = true;
  }

  static Future<bool> requestPermission() async {
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
  }) async {
    await _plugin.cancelAll();
    final location = timezone.isNotEmpty
        ? tz.getLocation(timezone)
        : tz.local;
    final now = tz.TZDateTime.now(location);

    for (final sub in subscriptions) {
      final reminderDay = sub.nextRenewalDate.subtract(Duration(days: daysBefore));
      final scheduled = tz.TZDateTime(
        location,
        reminderDay.year,
        reminderDay.month,
        reminderDay.day,
        9, // 09:00
      );

      if (scheduled.isBefore(now)) continue;

      final body = daysBefore == 0
          ? 'Bugün yenileniyor — ${sub.amount} ${sub.currency}'
          : '$daysBefore gün içinde yenileniyor — ${sub.amount} ${sub.currency}';

      await _plugin.zonedSchedule(
        sub.id.hashCode.abs() % 2147483647,
        sub.name,
        body,
        scheduled,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: 'Abonelik yenileme bildirimleri',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      );
    }
  }

  static Future<void> sendTestNotification() async {
    await _plugin.show(
      0,
      'Test Bildirimi',
      'SubscriptTrack bildirimleri çalışıyor ✓',
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
    );
  }

  static Future<void> cancelAll() => _plugin.cancelAll();
}
