import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/services/notification_read_sync_service.dart';
import '../../../features/subscriptions/domain/subscription_models.dart';
import '../data/notification_repository.dart';
import '../domain/app_notification.dart';

class NotificationController extends ChangeNotifier {
  NotificationController({
    NotificationReadSyncService? readSyncService,
    NotificationRepository? repository,
  })  : _readSync = readSyncService,
        _repo = repository ?? NotificationRepository();

  static const _prefsKey = 'notif_read_ids';

  final NotificationReadSyncService? _readSync;
  final NotificationRepository _repo;

  final Set<String> _readIds = {};
  List<AppNotification> _notifications = [];
  bool _loadedFromSupabase = false;

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

  /// Fetches notifications from Supabase and merges remote read state.
  /// Falls back silently — [refresh] handles the client-side view when offline.
  Future<void> load(String userId) async {
    final remote = await _repo.fetchRecent(userId);
    if (remote.isEmpty) return;

    _loadedFromSupabase = true;
    _notifications = remote;

    // Seed _readIds from remote read_at so the badge stays accurate.
    for (final n in remote) {
      if (n.readAtRemote) _readIds.add(n.id);
    }

    // Prune stale local IDs that no longer correspond to any notification.
    final currentIds = _notifications.map((n) => n.id).toSet();
    _readIds.removeWhere((id) => !currentIds.contains(id));

    await _saveReadState();
    notifyListeners();
  }

  /// Regenerates notifications from active subscriptions.
  /// Used as offline fallback; skipped when Supabase data is already loaded.
  void refresh(List<Subscription> active,
      {List<Subscription> trials = const []}) {
    if (_loadedFromSupabase) return;
    _notifications = _generate([...active, ...trials]);
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

    for (final sub in active.where((s) => s.isTrial)) {
      final end = sub.trialEndDate;
      if (end == null) continue;
      final today = DateTime(now.year, now.month, now.day);
      final endDay =
          DateTime(end.toLocal().year, end.toLocal().month, end.toLocal().day);
      final days = endDay.difference(today).inDays;
      if (days < 0 || days > 7) continue;
      final dateKey =
          '${endDay.year}${endDay.month.toString().padLeft(2, '0')}${endDay.day.toString().padLeft(2, '0')}';
      final type = days == 0
          ? NotificationType.trialToday
          : days <= 3
              ? NotificationType.trialSoon
              : NotificationType.trialUpcoming;
      result.add(AppNotification(
        id: '${sub.id}_trial_$dateKey',
        title: days == 0 ? 'Trial bugün bitiyor' : '$days gün trial kaldı',
        body: days == 0
            ? '${sub.name} trial süresi bugün bitiyor.'
            : '${sub.name} trial süresi $days gün içinde bitiyor.',
        type: type,
        subscriptionId: sub.id,
        createdAt: now,
      ));
    }

    result.sort((a, b) => a.type.index.compareTo(b.type.index));
    return result;
  }
}
