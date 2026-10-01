import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/error_messages.dart';
import '../domain/subscription_models.dart';

class SupabaseSubscriptionRepository implements SubscriptionDataSource {
  /// [client] verilmezse `Supabase.instance` kullanılır (testlerde enjekte edilir).
  SupabaseSubscriptionRepository({SupabaseClient? client}) : _injected = client;

  final SupabaseClient? _injected;

  SupabaseClient get _client => _injected ?? Supabase.instance.client;

  static const _table = 'subscriptions';

  @override
  Future<List<Subscription>> getAll(String userId) async {
    try {
      final rows = await _client
          .from(_table)
          .select()
          .eq('user_id', userId)
          // postgrest varsayılanı azalan sıradır; en yakın yenileme önce gelsin.
          .order('next_renewal_date', ascending: true);
      return rows.map(_fromRow).toList();
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
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
      final result =
          await _client.rpc('create_subscription_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
        'p_name': name.trim(),
        'p_amount': amount.toJson(),
        'p_currency': currency,
        'p_billing_cycle': billingCycle.key,
        'p_start_date': startDate.toIso8601String().substring(0, 10),
        'p_next_renewal_date':
            nextRenewalDate.toIso8601String().substring(0, 10),
        'p_category': category.key,
        'p_notes': notes?.trim(),
        'p_payment_method': paymentMethod?.trim(),
        'p_trial_end_date': trialEndDate?.toIso8601String().substring(0, 10),
        'p_trial_price_after': trialPriceAfter?.toJson(),
      });
      final row = Map<String, dynamic>.from(result as Map);
      return _fromRow(row);
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
    }
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    try {
      final result =
          await _client.rpc('update_subscription_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
        'p_subscription_id': updated.id,
        'p_name': updated.name,
        'p_amount': updated.amount.toJson(),
        'p_currency': updated.currency,
        'p_billing_cycle': updated.billingCycle.key,
        'p_start_date': updated.startDate.toIso8601String().substring(0, 10),
        'p_next_renewal_date':
            updated.nextRenewalDate.toIso8601String().substring(0, 10),
        'p_category': updated.category.key,
        'p_notes': updated.notes,
        'p_payment_method': updated.paymentMethod,
        'p_trial_end_date':
            updated.trialEndDate?.toIso8601String().substring(0, 10),
        'p_trial_price_after': updated.trialPriceAfter?.toJson(),
        'p_notification_rules':
            updated.notificationRules.map((r) => r.toJson()).toList(),
        'p_status': updated.status.key,
      });
      return _fromRow(Map<String, dynamic>.from(result as Map));
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
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
      throw dbException(e.code, e.message);
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
      final current = (await _client
          .from(_table)
          .select()
          .eq('id', id)
          .eq('user_id', userId)
          .single());
      await update(_fromRow(
          {...Map<String, dynamic>.from(current), 'status': status.key}));
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
    }
  }

  Subscription _fromRow(Map<String, dynamic> row) => Subscription.fromJson(row);
}
