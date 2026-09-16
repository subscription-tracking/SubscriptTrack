import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_environment.dart';

class PaymentEvent {
  const PaymentEvent(
      {required this.id,
      required this.subscriptionId,
      required this.amount,
      required this.currency,
      required this.paidAt});
  final String id;
  final String? subscriptionId;
  final double amount;
  final String currency;
  final DateTime paidAt;
}

class PaymentEventsRepository {
  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  Future<List<PaymentEvent>> fetch(String userId) async {
    final client = _client;
    if (client == null) return [];
    try {
      final rows = await client
          .from('payment_events')
          .select('id,subscription_id,amount,currency,paid_at')
          .eq('user_id', userId)
          .order('paid_at', ascending: false)
          .limit(500);
      return rows
          .map((row) => PaymentEvent(
                id: row['id'] as String,
                subscriptionId: row['subscription_id'] as String?,
                amount: (row['amount'] as num?)?.toDouble() ?? 0,
                currency: row['currency'] as String? ?? 'TRY',
                paidAt: DateTime.tryParse(row['paid_at'] as String? ?? '') ??
                    DateTime.now().toUtc(),
              ))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
