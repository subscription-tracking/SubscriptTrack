import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;

/// Zamanlanacak tek bir yerel bildirim (platformdan bağımsız).
class ScheduledNotification {
  const ScheduledNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.when,
    required this.channelDescription,
    required this.payload,
    required this.exact,
    this.withSnoozeAction = true,
  });

  final int id;
  final String title;
  final String body;
  final tz.TZDateTime when;
  final String channelDescription;

  /// Bildirime dokunulunca iletilen abonelik id'si.
  final String payload;

  /// `false` ise tam zamanlı alarm izni olmadığından yaklaşık zaman kullanılır.
  final bool exact;

  /// Bildirimde "Ertele" aksiyonu gösterilsin mi.
  final bool withSnoozeAction;
}

/// Platformda bekleyen bir bildirim.
class PendingNotification {
  const PendingNotification(this.id, this.payload);

  final int id;
  final String? payload;
}

/// `flutter_local_notifications` eklentisinin, servis mantığının ihtiyaç
/// duyduğu dar yüzü. Sahte bir uygulama ile zamanlama mantığı ana bilgisayarda
/// (eklenti olmadan) test edilebilir.
abstract interface class NotificationPlatform {
  /// [onResponse]: bildirime dokunulduğunda veya bir aksiyona basıldığında
  /// (payload, aksiyon id'si) ile çağrılır.
  Future<void> initialize({
    required void Function(String? payload, String? actionId) onResponse,
  });

  Future<void> schedule(ScheduledNotification notification);

  Future<void> show({
    required int id,
    required String title,
    required String body,
    String? payload,
  });

  Future<void> cancelAll();
  Future<void> cancel(int id);
  Future<List<PendingNotification>> pending();

  /// Kullanıcıya SORMADAN, bildirimlerin şu an açık olup olmadığı.
  Future<bool> areNotificationsEnabled();

  /// İzin isteği diyaloğunu açar; verildiyse `true`.
  Future<bool> requestPermission();

  /// Android 12+ tam zamanlı alarm izni var mı (diğer platformlarda `true`).
  Future<bool> canScheduleExact();

  /// Uygulama bir bildirime dokunularak açıldıysa payload'ı.
  Future<String?> launchPayload();
}

/// Gerçek uygulama: `flutter_local_notifications`.
class FlutterNotificationPlatform implements NotificationPlatform {
  FlutterNotificationPlatform([FlutterLocalNotificationsPlugin? plugin])
      : _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  final FlutterLocalNotificationsPlugin _plugin;

  static const _channelId = 'subscripttrack_renewals';
  static const _channelName = 'Yenileme Hatırlatmaları';
  static const snoozeActionId = 'snooze_reminder';
  static const _snoozeCategoryId = 'renewal_reminder_category';

  @override
  Future<void> initialize({
    required void Function(String? payload, String? actionId) onResponse,
  }) async {
    const android = AndroidInitializationSettings('@drawable/ic_stat_notify');
    final ios = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
      notificationCategories: [
        DarwinNotificationCategory(
          _snoozeCategoryId,
          actions: [
            DarwinNotificationAction.plain(snoozeActionId, 'Ertele'),
          ],
        ),
      ],
    );
    await _plugin.initialize(
      settings: InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: (response) =>
          onResponse(response.payload, response.actionId),
    );
  }

  @override
  Future<void> schedule(ScheduledNotification n) => _plugin.zonedSchedule(
        id: n.id,
        title: n.title,
        body: n.body,
        scheduledDate: n.when,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: n.channelDescription,
            importance: Importance.high,
            priority: Priority.high,
            visibility: NotificationVisibility.private,
            icon: '@mipmap/ic_launcher',
            actions: n.withSnoozeAction
                ? const [AndroidNotificationAction(snoozeActionId, 'Ertele')]
                : null,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
            categoryIdentifier: n.withSnoozeAction ? _snoozeCategoryId : null,
          ),
        ),
        androidScheduleMode: n.exact
            ? AndroidScheduleMode.exactAllowWhileIdle
            : AndroidScheduleMode.inexactAllowWhileIdle,
        payload: n.payload,
      );

  @override
  Future<void> show({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) =>
      _plugin.show(
        id: id,
        title: title,
        body: body,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            importance: Importance.high,
            priority: Priority.high,
            visibility: NotificationVisibility.private,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentSound: true,
          ),
        ),
        payload: payload,
      );

  @override
  Future<void> cancelAll() => _plugin.cancelAll();

  @override
  Future<void> cancel(int id) => _plugin.cancel(id: id);

  @override
  Future<List<PendingNotification>> pending() async =>
      (await _plugin.pendingNotificationRequests())
          .map((r) => PendingNotification(r.id, r.payload))
          .toList();

  AndroidFlutterLocalNotificationsPlugin? get _android =>
      _plugin.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();

  IOSFlutterLocalNotificationsPlugin? get _ios =>
      _plugin.resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin>();

  @override
  Future<bool> areNotificationsEnabled() async {
    final android = _android;
    if (android != null) return await android.areNotificationsEnabled() ?? true;
    final ios = _ios;
    if (ios != null) return (await ios.checkPermissions())?.isEnabled ?? true;
    return true;
  }

  @override
  Future<bool> requestPermission() async {
    final android = _android;
    if (android != null) {
      return await android.requestNotificationsPermission() ?? false;
    }
    final ios = _ios;
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

  @override
  Future<bool> canScheduleExact() async {
    final android = _android;
    if (android == null) return true;
    return await android.canScheduleExactNotifications() != false;
  }

  @override
  Future<String?> launchPayload() async {
    final details = await _plugin.getNotificationAppLaunchDetails();
    if (details?.didNotificationLaunchApp != true) return null;
    return details?.notificationResponse?.payload;
  }
}
