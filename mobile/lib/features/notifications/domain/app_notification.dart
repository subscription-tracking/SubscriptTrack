enum NotificationType {
  renewalToday,
  renewalSoon,
  renewalUpcoming,
  trialToday,
  trialSoon,
  trialUpcoming,
}

extension NotificationTypeExt on NotificationType {
  String get icon => switch (this) {
        NotificationType.renewalToday => '🔴',
        NotificationType.renewalSoon => '🟡',
        NotificationType.renewalUpcoming => '🔵',
        NotificationType.trialToday => '🟣',
        NotificationType.trialSoon => '🟣',
        NotificationType.trialUpcoming => '🟣',
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
    this.readAtRemote = false,
  });

  final String id;
  final String title;
  final String body;
  final NotificationType type;
  final DateTime createdAt;
  final String? subscriptionId;
  // True when read_at is set in the notifications table.
  final bool readAtRemote;
}
