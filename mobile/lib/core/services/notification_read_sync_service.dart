import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_environment.dart';

/// Batches in-app notification read events and persists them to Supabase.
/// Called after [NotificationController.markRead] / [markAllRead].
class NotificationReadSyncService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<void> syncRead(Set<String> ids) async {
    if (ids.isEmpty || !EnvironmentConfig.isSupabaseConfigured) return;
    try {
      await _client
          .from('notifications')
          .update({'read_at': DateTime.now().toUtc().toIso8601String()})
          .inFilter('id', ids.toList())
          .isFilter('read_at', null);
    } catch (_) {
      // Best-effort: local SharedPreferences read state is the source of truth.
    }
  }
}
