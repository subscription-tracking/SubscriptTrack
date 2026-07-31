import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/subscription_models.dart';

class SupabaseSubscriptionRepository implements SubscriptionDataSource {
  SupabaseClient get _client => Supabase.instance.client;

  static const _table = 'subscriptions';

  @override
  Future<List<Subscription>> getAll(String userId) async {
    try {
      final rows = await _client
          .from(_table)
          .select()
          .eq('user_id', userId)
          .order('next_renewal_date');
      return rows.map(_fromRow).toList();
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required double amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
  }) async {
    try {
      final row = await _client
          .from(_table)
          .insert({
            'user_id': userId,
            'name': name.trim(),
            'amount': amount,
            'currency': currency,
            'billing_cycle': billingCycle.key,
            'start_date': startDate.toIso8601String().substring(0, 10),
            'next_renewal_date':
                nextRenewalDate.toIso8601String().substring(0, 10),
            'category': category.key,
            'notes': notes?.trim(),
            'status': SubscriptionStatus.active.key,
          })
          .select()
          .single();
      return _fromRow(row);
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    try {
      final row = await _client
          .from(_table)
          .update({
            'name': updated.name,
            'amount': updated.amount,
            'currency': updated.currency,
            'billing_cycle': updated.billingCycle.key,
            'next_renewal_date':
                updated.nextRenewalDate.toIso8601String().substring(0, 10),
            'category': updated.category.key,
            'notes': updated.notes,
            'status': updated.status.key,
          })
          .eq('id', updated.id)
          .eq('user_id', updated.userId)
          .select()
          .single();
      return _fromRow(row);
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {
    try {
      await _client
          .from(_table)
          .delete()
          .eq('id', subscriptionId)
          .eq('user_id', userId);
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  @override
  Future<void> archive(String userId, String subscriptionId) =>
      _setStatus(userId, subscriptionId, SubscriptionStatus.archived);

  @override
  Future<void> restore(String userId, String subscriptionId) =>
      _setStatus(userId, subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> pause(String userId, String subscriptionId) =>
      _setStatus(userId, subscriptionId, SubscriptionStatus.paused);

  @override
  Future<void> resume(String userId, String subscriptionId) =>
      _setStatus(userId, subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> cancel(String userId, String subscriptionId) =>
      _setStatus(userId, subscriptionId, SubscriptionStatus.cancelled);

  // ─── Helpers ────────────────────────────────────────────────

  Future<void> _setStatus(
      String userId, String id, SubscriptionStatus status) async {
    try {
      await _client
          .from(_table)
          .update({'status': status.key})
          .eq('id', id)
          .eq('user_id', userId);
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  Subscription _fromRow(Map<String, dynamic> row) {
    final status = row['status'] != null
        ? SubscriptionStatusExt.fromKey(row['status'] as String)
        : (row['is_archived'] as bool? ?? false)
            ? SubscriptionStatus.archived
            : SubscriptionStatus.active;

    return Subscription(
      id: row['id'] as String,
      userId: row['user_id'] as String,
      name: row['name'] as String,
      amount: (row['amount'] as num).toDouble(),
      currency: row['currency'] as String? ?? 'TRY',
      billingCycle: BillingCycleLabel.fromKey(row['billing_cycle'] as String),
      startDate: row['start_date'] != null
          ? DateTime.parse(row['start_date'] as String)
          : DateTime.now(),
      nextRenewalDate: DateTime.parse(row['next_renewal_date'] as String),
      category: SubscriptionCategoryLabel.fromKey(row['category'] as String),
      notes: row['notes'] as String?,
      status: status,
      createdAt: DateTime.parse(row['created_at'] as String),
    );
  }
}
