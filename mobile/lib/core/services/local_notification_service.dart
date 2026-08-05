import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../../features/subscriptions/domain/subscription_models.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static const _channelId = 'subscripttrack_renewals';
  static const _channelName = 'Yenileme Hatırlatmaları';

  /// Hash of the last schedule call — avoids redundant cancels+reschedules.
  static int? _lastScheduleHash;

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
  }) async {
    if (kIsWeb || !_initialized) return;
    // Deduplicate: skip reschedule if inputs haven't changed.
    final hash = Object.hashAll([
      daysBefore,
      timezone,
      ...subscriptions.map((s) => Object.hash(s.id, s.nextRenewalDate.millisecondsSinceEpoch, s.status.index)),
    ]);
    if (hash == _lastScheduleHash) return;
    _lastScheduleHash = hash;

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
          ? 'Bugün yenileniyor — ${sub.amount.amount} ${sub.currency}'
          : '$daysBefore gün içinde yenileniyor — ${sub.amount.amount} ${sub.currency}';

      // Composite key: sub.id + daysBefore + tarih → çakışmayı engeller
      final dateKey =
          '${reminderDay.year}${reminderDay.month.toString().padLeft(2, '0')}${reminderDay.day.toString().padLeft(2, '0')}';
      final stableNotifId =
          '${sub.id}|$daysBefore|$dateKey'.hashCode.abs() % 2147483647;

      await _plugin.zonedSchedule(
        stableNotifId,
        sub.name,
        body,
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
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      );
    }
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
}
