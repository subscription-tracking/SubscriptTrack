import 'dart:convert';

import 'package:supabase_flutter/supabase_flutter.dart' hide LocalStorage;
import 'package:uuid/uuid.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/local_storage.dart';

class PaymentEvent {
  const PaymentEvent(
      {required this.id,
      required this.subscriptionId,
      required this.amount,
      required this.currency,
      required this.paidAt});
  final String id;
  final String? subscriptionId;
  final Money amount;
  final String currency;
  final DateTime paidAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'subscriptionId': subscriptionId,
        'amount': amount.toJson(),
        'currency': currency,
        'paidAt': paidAt.toUtc().toIso8601String(),
      };

  factory PaymentEvent.fromJson(Map<String, dynamic> json) => PaymentEvent(
        id: json['id'] as String,
        subscriptionId: json['subscriptionId'] as String? ??
            json['subscription_id'] as String?,
        amount: Money.fromJson(json['amount']),
        currency: json['currency'] as String? ?? 'TRY',
        paidAt: DateTime.parse((json['paidAt'] ?? json['paid_at']) as String),
      );
}

class PaymentEventsRepository {
  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  Future<List<PaymentEvent>> fetch(String userId) async {
    final client = _client;
    if (client == null) return _readLocal(userId);
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
                amount: Money.fromJson(row['amount']),
                currency: row['currency'] as String? ?? 'TRY',
                paidAt: DateTime.tryParse(row['paid_at'] as String? ?? '') ??
                    DateTime.now().toUtc(),
              ))
          .toList();
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  Future<PaymentEvent> record({
    required String userId,
    required String subscriptionId,
    required Money amount,
    required String currency,
    required DateTime paidAt,
  }) async {
    final client = _client;
    if (client == null) {
      return _recordLocal(userId, subscriptionId, amount, currency, paidAt);
    }
    try {
      final result = await client.rpc('record_payment_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
        'p_subscription_id': subscriptionId,
        'p_amount': amount.toJson(),
        'p_currency': currency,
        'p_paid_at': paidAt.toUtc().toIso8601String(),
      });
      final row = Map<String, dynamic>.from(result as Map);
      return PaymentEvent(
        id: row['id'] as String,
        subscriptionId: row['subscription_id'] as String?,
        amount: Money.fromJson(row['amount']),
        currency: row['currency'] as String,
        paidAt: DateTime.parse(row['paid_at'] as String),
      );
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  Future<void> delete({required String userId, required String id}) async {
    final client = _client;
    if (client == null) {
      final events = await _readLocal(userId);
      await LocalStorage.instance.writePaymentEvents(
        userId,
        jsonEncode(events.where((event) => event.id != id).map((e) => e.toJson()).toList()),
      );
      return;
    }
    try {
      await client.from('payment_events').delete().eq('id', id).eq('user_id', userId);
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  Future<PaymentEvent> update({required String userId, required PaymentEvent event}) async {
    final client = _client;
    if (client == null) {
      final events = await _readLocal(userId);
      final updated = events.map((e) => e.id == event.id ? event : e).toList();
      await LocalStorage.instance.writePaymentEvents(userId, jsonEncode(updated.map((e) => e.toJson()).toList()));
      return event;
    }
    try {
      final row = await client.from('payment_events').update({
        'amount': event.amount.toJson(),
        'currency': event.currency,
        'paid_at': event.paidAt.toUtc().toIso8601String(),
      }).eq('id', event.id).eq('user_id', userId).select('id,subscription_id,amount,currency,paid_at').single();
      return PaymentEvent(id: row['id'] as String, subscriptionId: row['subscription_id'] as String?, amount: Money.fromJson(row['amount']), currency: row['currency'] as String, paidAt: DateTime.parse(row['paid_at'] as String));
    } on PostgrestException catch (e) {
      throw NetworkException(e.message);
    }
  }

  Future<List<PaymentEvent>> _readLocal(String userId) async {
    final raw = await LocalStorage.instance.readPaymentEvents(userId);
    if (raw == null) {
      return [];
    }
    final rows = jsonDecode(raw) as List<dynamic>;
    return rows
        .map((row) =>
            PaymentEvent.fromJson(Map<String, dynamic>.from(row as Map)))
        .toList();
  }

  Future<PaymentEvent> _recordLocal(String userId, String subscriptionId,
      Money amount, String currency, DateTime paidAt) async {
    final events = await _readLocal(userId);
    final event = PaymentEvent(
      id: const Uuid().v4(),
      subscriptionId: subscriptionId,
      amount: amount,
      currency: currency,
      paidAt: paidAt.toUtc(),
    );
    await LocalStorage.instance.writePaymentEvents(
      userId,
      jsonEncode([event.toJson(), ...events.map((e) => e.toJson())]),
    );
    return event;
  }
}
