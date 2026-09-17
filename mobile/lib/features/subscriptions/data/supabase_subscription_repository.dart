import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/subscription_models.dart';
import '../../notifications/domain/notification_rule.dart';

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

  /// Test 54: Supabase Realtime üzerinden canlı senkronizasyon. Bu kullanıcının
  /// abonelik satırlarında (başka bir cihazdan) herhangi bir INSERT/UPDATE/
  /// DELETE olduğunda yeni tam listeyi yayınlar — polling/manuel yenileme
  /// gerekmeden diğer cihazlardaki değişiklikler kısa sürede yansır.
  Stream<List<Subscription>> watchAll(String userId) => _client
      .from(_table)
      .stream(primaryKey: ['id'])
      .eq('user_id', userId)
      .order('next_renewal_date')
      .map((rows) => rows.map(_fromRow).toList());

  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
  }) async {
    try {
      final result = await _client.rpc('create_subscription_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
        'p_name': name.trim(),
        'p_amount': amount.toJson(),
        'p_currency': currency,
        'p_billing_cycle': billingCycle.key,
        'p_start_date': startDate.toIso8601String().substring(0, 10),
        'p_next_renewal_date': nextRenewalDate.toIso8601String().substring(0, 10),
        'p_category': category.key,
        'p_notes': notes?.trim(),
        'p_payment_method': paymentMethod?.trim(),
        'p_trial_end_date': trialEndDate?.toIso8601String().substring(0, 10),
        'p_trial_price_after': trialPriceAfter?.toJson(),
      });
      final row = Map<String, dynamic>.from(result as Map);
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
            'amount': updated.amount.toJson(),
            'currency': updated.currency,
            'billing_cycle': updated.billingCycle.key,
            'next_renewal_date':
                updated.nextRenewalDate.toIso8601String().substring(0, 10),
            'category': updated.category.key,
            'notes': updated.notes,
            'payment_method': updated.paymentMethod,
            'status': updated.status.key,
            'trial_end_date':
                updated.trialEndDate?.toIso8601String().substring(0, 10),
            'trial_price_after': updated.trialPriceAfter?.toJson(),
            'notification_rules':
                updated.notificationRules.map((rule) => rule.toJson()).toList(),
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
      amount: Money.fromJson(row['amount']),
      currency: row['currency'] as String? ?? 'TRY',
      billingCycle: BillingCycleLabel.fromKey(
          row['billing_cycle'] as String? ?? 'monthly'),
      startDate: row['start_date'] != null
          ? DateTime.tryParse(row['start_date'] as String) ?? DateTime.now()
          : DateTime.now(),
      nextRenewalDate:
          DateTime.tryParse(row['next_renewal_date'] as String? ?? '') ??
              DateTime.now(),
      category: SubscriptionCategoryLabel.fromKey(
          row['category'] as String? ?? 'other'),
      notes: row['notes'] as String?,
      paymentMethod: row['payment_method'] as String?,
      trialEndDate: DateTime.tryParse(row['trial_end_date'] as String? ?? ''),
      trialPriceAfter: row['trial_price_after'] == null
          ? null
          : Money.fromJson(row['trial_price_after']),
      notificationRules: (row['notification_rules'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(NotificationRule.fromJson)
              .toList() ??
          const [NotificationRule(daysBefore: 3)],
      status: status,
      createdAt: DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.now().toUtc(),
    );
  }
}
