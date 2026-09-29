import '../../features/notifications/domain/notification_rule.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

/// Uygulamanın ihtiyaç duyduğu yerel bildirim işlemleri. Somut uygulama
/// `LocalNotificationService`'tir; testlerde ve web'de [NoopNotificationScheduler]
/// kullanılır. Provider ile uygulama köküne sağlanır.
abstract interface class NotificationScheduler {
  /// Bildirime dokunulunca (payload = abonelik id'si) tetiklenir.
  void Function(String subscriptionId)? onNotificationTap;

  /// Bildirimdeki "Ertele" aksiyonuna basılınca tetiklenir.
  void Function(String subscriptionId)? onSnoozeRequested;

  Future<void> initialize();

  /// Uygulama bir bildirime dokunularak sıfırdan açıldıysa abonelik id'si.
  Future<String?> getLaunchNotificationSubscriptionId();

  /// İzin isteği diyaloğu açmadan, bildirimlerin açık olup olmadığı.
  Future<bool> arePermissionsGranted();
  Future<bool> requestPermission();

  /// Cihaz saat dilimi değiştiyse `true` döner.
  Future<bool> refreshDeviceLocalTimezone();

  Future<void> scheduleRenewalReminders(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone,
    List<Subscription> trials,
    List<NotificationRule> rules,
    int reminderHour,
  });

  Future<void> snooze(Subscription sub, {Duration? duration});
  Future<void> sendTestNotification();
  Future<void> cancelAll();

  /// [subscriptionId] aboneliğine ait tüm bekleyen bildirimleri iptal eder.
  Future<void> cancelForSubscription(String subscriptionId);
}

/// Hiçbir şey yapmayan uygulama (web, testler, platform kullanılamıyorsa).
class NoopNotificationScheduler implements NotificationScheduler {
  NoopNotificationScheduler();

  @override
  void Function(String subscriptionId)? onNotificationTap;

  @override
  void Function(String subscriptionId)? onSnoozeRequested;

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> getLaunchNotificationSubscriptionId() async => null;

  @override
  Future<bool> arePermissionsGranted() async => true;

  @override
  Future<bool> requestPermission() async => false;

  @override
  Future<bool> refreshDeviceLocalTimezone() async => false;

  @override
  Future<void> scheduleRenewalReminders(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int reminderHour = 9,
  }) async {}

  @override
  Future<void> snooze(Subscription sub, {Duration? duration}) async {}

  @override
  Future<void> sendTestNotification() async {}

  @override
  Future<void> cancelAll() async {}

  @override
  Future<void> cancelForSubscription(String subscriptionId) async {}
}
