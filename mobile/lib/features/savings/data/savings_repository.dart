import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';

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
}
