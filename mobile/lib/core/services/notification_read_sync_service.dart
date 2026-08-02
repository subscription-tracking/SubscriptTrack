import '../network/api_client.dart';

/// Batches in-app notification read events and persists them to the backend.
///
/// Backend endpoint:
///   POST /v1/notifications/read-batch
///   Body: { "notification_ids": ["id1", "id2", ...] }
///
/// Called after [NotificationController.markRead] / [markAllRead] when the
/// API is configured, so read state survives across devices and re-installs.
class NotificationReadSyncService {
  const NotificationReadSyncService(this._client);

  final ApiClient _client;

  static const _endpoint = '/api/v1/notifications/read-batch';

  /// Sends a batch of notification IDs to the backend as read.
  /// Silently swallows errors — local state is authoritative; backend sync
  /// is best-effort.
  Future<void> syncRead(Set<String> ids) async {
    if (ids.isEmpty) return;
    try {
      await _client.post(_endpoint, {
        'notification_ids': ids.toList(),
      });
    } catch (_) {
      // Best-effort: local SharedPreferences read state is the source of truth.
    }
  }
}
