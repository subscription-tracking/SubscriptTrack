import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';

class SavingsEvent {
  const SavingsEvent(
      {required this.eventType,
      required this.monthlyAmount,
      required this.annualAmount,
      required this.currency,
      required this.effectiveAt});
  final String eventType;
  final double monthlyAmount;
  final double annualAmount;
  final String currency;
  final DateTime effectiveAt;
}

class SavingsRepository {
  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  Future<void> record({
    required String userId,
    required String subscriptionId,
    required String eventType,
    required double monthlyAmount,
    required double annualAmount,
    required String currency,
  }) async {
    final client = _client;
    if (client == null) return;
    try {
      await client.from('savings_events').insert({
        'user_id': userId,
        'subscription_id': subscriptionId,
        'event_type': eventType,
        'monthly_amount': monthlyAmount,
        'annual_amount': annualAmount,
        'currency': currency,
      });
    } catch (_) {
      // Best-effort — a missed savings event is not critical.
    }
  }

  Future<List<SavingsEvent>> fetch(String userId) async {
    final client = _client;
    if (client == null) return [];
    try {
      final rows = await client
          .from('savings_events')
          .select()
          .eq('user_id', userId)
          .order('effective_at', ascending: false)
          .limit(100);
      return rows
          .map((row) => SavingsEvent(
                eventType: row['event_type'] as String? ?? 'CANCELLED',
                monthlyAmount: (row['monthly_amount'] as num?)?.toDouble() ?? 0,
                annualAmount: (row['annual_amount'] as num?)?.toDouble() ?? 0,
                currency: row['currency'] as String? ?? 'TRY',
                effectiveAt:
                    DateTime.tryParse(row['effective_at'] as String? ?? '') ??
                        DateTime.now().toUtc(),
              ))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
