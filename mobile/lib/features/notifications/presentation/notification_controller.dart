import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/errors/error_messages.dart';
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
  static const _dismissedPrefsKey = 'notif_dismissed_ids';

  final NotificationReadSyncService? _readSync;
  final NotificationRepository _repo;

  final Set<String> _readIds = {};
  final Set<String> _dismissedIds = {};
  List<AppNotification> _notifications = [];
  bool _loadedFromSupabase = false;

  /// S45: bildirimler abonelik durumundan her seferinde yeniden üretildiği
  /// (bkz. [_generate]) için "silme" kalıcı bir kayıt değil, cihazda saklanan
  /// bir gizleme listesidir — kullanıcı bir bildirimi kapattığında aynı
  /// stableId bir daha listede görünmez.
  List<AppNotification> get all =>
      _notifications.where((n) => !_dismissedIds.contains(n.id)).toList();

  int get unreadCount => _notifications
      .where((n) => !_readIds.contains(n.id) && !_dismissedIds.contains(n.id))
      .length;

  bool isRead(String id) => _readIds.contains(id);

  Future<void> loadReadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final ids = prefs.getStringList(_prefsKey) ?? [];
      _readIds.addAll(ids);
      final dismissed = prefs.getStringList(_dismissedPrefsKey) ?? [];
      _dismissedIds.addAll(dismissed);
      notifyListeners();
    } catch (e) {
      logIgnoredError('NotificationController.loadReadState', e);
    }
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
    _dismissedIds.removeWhere((id) => !currentIds.contains(id));

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
    _dismissedIds.removeWhere((id) => !currentIds.contains(id));
    notifyListeners();
  }

  Future<void> markRead(String id) async {
    _readIds.add(id);
    await _saveReadState();
    await _readSync?.syncRead({id});
    notifyListeners();
  }

  /// S45: tek bir bildirimi listeden kapatır (swipe-to-dismiss). Bildirimler
  /// abonelik durumundan türetildiği için bu kalıcı bir "sil" değil, o
  /// stableId için cihaza özel bir gizleme kaydıdır.
  Future<void> dismiss(String id) async {
    _dismissedIds.add(id);
    await _saveReadState();
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
      await prefs.setStringList(_dismissedPrefsKey, _dismissedIds.toList());
    } catch (e) {
      logIgnoredError('NotificationController.persist', e);
    }
  }

  List<AppNotification> _generate(List<Subscription> active) {
    final now = DateTime.now();
    final result = <AppNotification?>[
      for (final sub in active) _renewalNotification(sub, now),
      for (final sub in active.where((s) => s.isTrial))
        _trialNotification(sub, now),
    ].nonNulls.toList();
    result.sort((a, b) => a.type.index.compareTo(b.type.index));
    return result;
  }

  static String _dateKey(DateTime d) =>
      '${d.year}${d.month.toString().padLeft(2, '0')}'
      '${d.day.toString().padLeft(2, '0')}';

  AppNotification? _renewalNotification(Subscription sub, DateTime now) {
    final days = sub.daysUntilRenewal;
    if (days < 0 || days > 7) return null;
    final (title, body, type) = switch (days) {
      0 => (
          'Bugün yenileniyor',
          '${sub.name} bugün yenileniyor.',
          NotificationType.renewalToday,
        ),
      <= 3 => (
          '$days gün kaldı',
          '${sub.name} $days gün içinde yenileniyor.',
          NotificationType.renewalSoon,
        ),
      _ => (
          'Yaklaşan yenileme',
          '${sub.name} $days gün içinde yenileniyor.',
          NotificationType.renewalUpcoming,
        ),
    };
    return AppNotification(
      id: '${sub.id}_${_dateKey(sub.nextRenewalDate)}',
      title: title,
      body: body,
      type: type,
      subscriptionId: sub.id,
      createdAt: now,
    );
  }

  AppNotification? _trialNotification(Subscription sub, DateTime now) {
    final end = sub.trialEndDate;
    if (end == null) return null;
    final today = DateTime(now.year, now.month, now.day);
    final local = end.toLocal();
    final endDay = DateTime(local.year, local.month, local.day);
    final days = endDay.difference(today).inDays;
    if (days < 0 || days > 7) return null;
    final (title, body, type) = switch (days) {
      0 => (
          'Ücretsiz deneme bugün sona eriyor',
          '${sub.name} ücretsiz denemesi bugün sona eriyor.',
          NotificationType.trialToday,
        ),
      <= 3 => (
          'Denemenin bitmesine $days gün kaldı',
          '${sub.name} ücretsiz denemesi $days gün içinde sona eriyor.',
          NotificationType.trialSoon,
        ),
      _ => (
          'Denemenin bitmesine $days gün kaldı',
          '${sub.name} ücretsiz denemesi $days gün içinde sona eriyor.',
          NotificationType.trialUpcoming,
        ),
    };
    return AppNotification(
      id: '${sub.id}_trial_${_dateKey(endDay)}',
      title: title,
      body: body,
      type: type,
      subscriptionId: sub.id,
      createdAt: now,
    );
  }
}
