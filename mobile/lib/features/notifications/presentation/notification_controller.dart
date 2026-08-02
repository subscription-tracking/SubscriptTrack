import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/services/notification_read_sync_service.dart';
import '../../../features/subscriptions/domain/subscription_models.dart';
import '../domain/app_notification.dart';

class NotificationController extends ChangeNotifier {
  NotificationController({NotificationReadSyncService? readSyncService})
      : _readSync = readSyncService;

  static const _prefsKey = 'notif_read_ids';

  final NotificationReadSyncService? _readSync;

  final Set<String> _readIds = {};
  List<AppNotification> _notifications = [];

  List<AppNotification> get all => _notifications;

  int get unreadCount =>
      _notifications.where((n) => !_readIds.contains(n.id)).length;

  bool isRead(String id) => _readIds.contains(id);

  Future<void> loadReadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final ids = prefs.getStringList(_prefsKey) ?? [];
      _readIds.addAll(ids);
      notifyListeners();
    } catch (_) {}
  }

  void refresh(List<Subscription> active) {
    _notifications = _generate(active);
    // Eski ID'leri bellekten temizle — persist etme, loadReadState sonrası çağrılır
    final currentIds = _notifications.map((n) => n.id).toSet();
    _readIds.removeWhere((id) => !currentIds.contains(id));
    notifyListeners();
  }

  Future<void> markRead(String id) async {
    _readIds.add(id);
    await _saveReadState();
    await _readSync?.syncRead({id});
    notifyListeners();
  }

  Future<void> markAllRead() async {
    final unread = _notifications
        .where((n) => !_readIds.contains(n.id))
        .map((n) => n.id)
        .toSet();
    _readIds.addAll(unread);
    await _saveReadState();
    await _readSync?.syncRead(unread);
    notifyListeners();
  }

  Future<void> _saveReadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_prefsKey, _readIds.toList());
    } catch (_) {}
  }

  List<AppNotification> _generate(List<Subscription> active) {
    final result = <AppNotification>[];
    final now = DateTime.now();

    for (final sub in active) {
      final days = sub.daysUntilRenewal;
      if (days < 0) continue;

      // ID, yenileme tarihine sabitlenir — days değişse bile aynı kalır
      final d = sub.nextRenewalDate;
      final dateKey =
          '${d.year}${d.month.toString().padLeft(2, '0')}${d.day.toString().padLeft(2, '0')}';
      final stableId = '${sub.id}_$dateKey';

      if (days == 0) {
        result.add(AppNotification(
          id: stableId,
          title: 'Bugün yenileniyor',
          body: '${sub.name} bugün yenileniyor.',
          type: NotificationType.renewalToday,
          subscriptionId: sub.id,
          createdAt: now,
        ));
      } else if (days <= 3) {
        result.add(AppNotification(
          id: stableId,
          title: '$days gün kaldı',
          body: '${sub.name} $days gün içinde yenileniyor.',
          type: NotificationType.renewalSoon,
          subscriptionId: sub.id,
          createdAt: now,
        ));
      } else if (days <= 7) {
        result.add(AppNotification(
          id: stableId,
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
