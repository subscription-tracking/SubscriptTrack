enum NotificationType { renewalToday, renewalSoon, renewalUpcoming }

extension NotificationTypeExt on NotificationType {
  String get icon => switch (this) {
        NotificationType.renewalToday => '🔴',
        NotificationType.renewalSoon => '🟡',
        NotificationType.renewalUpcoming => '🔵',
      };
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.subscriptionId,
  });

  final String id;
  final String title;
  final String body;
  final NotificationType type;
  final DateTime createdAt;
  final String? subscriptionId;
}
