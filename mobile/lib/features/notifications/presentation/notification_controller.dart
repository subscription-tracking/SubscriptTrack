import 'package:flutter/foundation.dart';

import '../../../features/subscriptions/domain/subscription_models.dart';
import '../domain/app_notification.dart';

class NotificationController extends ChangeNotifier {
  final Set<String> _readIds = {};
  List<AppNotification> _notifications = [];

  List<AppNotification> get all => _notifications;

  int get unreadCount =>
      _notifications.where((n) => !_readIds.contains(n.id)).length;

  bool isRead(String id) => _readIds.contains(id);

  void refresh(List<Subscription> active) {
    _notifications = _generate(active);
    notifyListeners();
  }

  void markRead(String id) {
    _readIds.add(id);
    notifyListeners();
  }

  void markAllRead() {
    _readIds.addAll(_notifications.map((n) => n.id));
    notifyListeners();
  }

  List<AppNotification> _generate(List<Subscription> active) {
    final result = <AppNotification>[];
    final now = DateTime.now();

    for (final sub in active) {
      final days = sub.daysUntilRenewal;
      if (days < 0) continue;

      if (days == 0) {
        result.add(AppNotification(
          id: '${sub.id}_0',
          title: 'Bugün yenileniyor',
          body: '${sub.name} bugün yenileniyor.',
          type: NotificationType.renewalToday,
          subscriptionId: sub.id,
          createdAt: now,
        ));
      } else if (days <= 3) {
        result.add(AppNotification(
          id: '${sub.id}_$days',
          title: '$days gün kaldı',
          body: '${sub.name} $days gün içinde yenileniyor.',
          type: NotificationType.renewalSoon,
          subscriptionId: sub.id,
          createdAt: now,
        ));
      } else if (days <= 7) {
        result.add(AppNotification(
          id: '${sub.id}_$days',
          title: 'Yaklaşan yenileme',
          body: '${sub.name} $days gün içinde yenileniyor.',
          type: NotificationType.renewalUpcoming,
          subscriptionId: sub.id,
          createdAt: now,
        ));
      }
    }

    result.sort((a, b) => a.type.index.compareTo(b.type.index));
    return result;
  }
}
