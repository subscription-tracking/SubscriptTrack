import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/app_notification.dart';

class NotificationRepository {
  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  /// Fetches the last 14 days of notifications for [userId] from Supabase.
  /// Returns an empty list when offline or Supabase is not configured.
  Future<List<AppNotification>> fetchRecent(String userId) async {
    final client = _client;
    if (client == null) return [];
    try {
      final cutoff = DateTime.now().toUtc().subtract(const Duration(days: 14));
      final rows = await client
          .from('notifications')
          .select()
          .eq('user_id', userId)
          .gte('created_at', cutoff.toIso8601String())
          .order('created_at', ascending: false)
          .limit(50);
      return rows.map(_fromRow).whereType<AppNotification>().toList();
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  AppNotification? _fromRow(Map<String, dynamic> row) {
    final type = _parseType(row['type'] as String? ?? '');
    if (type == null) return null;

    final params = (row['body_params'] as Map<String, dynamic>?) ?? {};
    final name = params['name'] as String? ?? '';
    final days = (params['days'] as num?)?.toInt() ?? 0;

    return AppNotification(
      id: row['id'] as String,
      title: _title(type, days),
      body: _body(type, name, days),
      type: type,
      subscriptionId: row['subscription_id'] as String?,
      createdAt: DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.now().toUtc(),
      readAtRemote: row['read_at'] != null,
    );
  }

  NotificationType? _parseType(String raw) => switch (raw) {
        'renewal_today' => NotificationType.renewalToday,
        'renewal_soon' => NotificationType.renewalSoon,
        'renewal_upcoming' => NotificationType.renewalUpcoming,
        'trial_today' => NotificationType.trialToday,
        'trial_soon' => NotificationType.trialSoon,
        'trial_upcoming' => NotificationType.trialUpcoming,
        _ => null,
      };

  String _title(NotificationType type, int days) => switch (type) {
        NotificationType.renewalToday => 'Bugün yenileniyor',
        NotificationType.renewalSoon => '$days gün kaldı',
        NotificationType.renewalUpcoming => 'Yaklaşan yenileme',
        NotificationType.trialToday => 'Trial bugün bitiyor',
        NotificationType.trialSoon => '$days gün trial kaldı',
        NotificationType.trialUpcoming => 'Yaklaşan trial bitişi',
      };

  String _body(NotificationType type, String name, int days) => switch (type) {
        NotificationType.renewalToday => '$name bugün yenileniyor.',
        NotificationType.renewalSoon => '$name $days gün içinde yenileniyor.',
        NotificationType.renewalUpcoming =>
          '$name $days gün içinde yenileniyor.',
        NotificationType.trialToday => '$name trial süresi bugün bitiyor.',
        NotificationType.trialSoon =>
          '$name trial süresi $days gün içinde bitiyor.',
        NotificationType.trialUpcoming =>
          '$name trial süresi $days gün içinde bitiyor.',
      };
}
