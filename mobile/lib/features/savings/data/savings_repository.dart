import 'dart:convert';

import 'package:supabase_flutter/supabase_flutter.dart' hide LocalStorage;

import '../../../core/config/app_environment.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/error_messages.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/savings_event.dart';

export '../domain/savings_event.dart';

class SavingsRepository {
  SavingsRepository({SupabaseClient? client}) : _injected = client;

  final SupabaseClient? _injected;

  SupabaseClient? get _client =>
      _injected ??
      (EnvironmentConfig.isSupabaseConfigured
          ? Supabase.instance.client
          : null);

  Future<void> record({
    required String userId,
    required String subscriptionId,
    required String eventType,
    required Money monthlyAmount,
    required Money annualAmount,
    required String currency,
  }) async {
    final client = _client;
    if (client == null) {
      final events = await _readLocal(userId);
      final event = SavingsEvent(
        eventType: eventType,
        monthlyAmount: monthlyAmount,
        annualAmount: annualAmount,
        currency: currency,
        effectiveAt: DateTime.now().toUtc(),
      );
      await LocalStorage.instance.writeSavingsEvents(
        userId,
        jsonEncode([event.toJson(), ...events.map((e) => e.toJson())]),
      );
      return;
    }
    try {
      await client.from('savings_events').insert({
        'user_id': userId,
        'subscription_id': subscriptionId,
        'event_type': eventType,
        'monthly_amount': monthlyAmount.toJson(),
        'annual_amount': annualAmount.toJson(),
        'currency': currency,
      });
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
    }
  }

  Future<List<SavingsEvent>> fetch(String userId) async {
    final client = _client;
    if (client == null) return _readLocal(userId);
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
                monthlyAmount: Money.fromJson(row['monthly_amount']),
                annualAmount: Money.fromJson(row['annual_amount']),
                currency: row['currency'] as String? ?? 'TRY',
                effectiveAt:
                    DateTime.tryParse(row['effective_at'] as String? ?? '') ??
                        DateTime.now().toUtc(),
              ))
          .toList();
    } on PostgrestException catch (e) {
      throw dbException(e.code, e.message);
    }
  }

  Future<List<SavingsEvent>> _readLocal(String userId) async {
    final raw = await LocalStorage.instance.readSavingsEvents(userId);
    if (raw == null) return [];
    final rows = jsonDecode(raw) as List<dynamic>;
    return rows
        .map((row) =>
            SavingsEvent.fromJson(Map<String, dynamic>.from(row as Map)))
        .toList();
  }
}
