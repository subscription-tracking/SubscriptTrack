import 'dart:convert';

import 'package:uuid/uuid.dart';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/subscription_models.dart';

/// Supabase yapılandırılmadığında kullanılan yerel depo.
/// Veriler SharedPreferences'a JSON olarak yazılır.
class LocalSubscriptionRepository implements SubscriptionDataSource {
  static const _uuid = Uuid();

  Future<List<Subscription>> _readAll(String userId) async {
    final raw = await LocalStorage.instance.readSubscriptions(userId);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _writeAll(String userId, List<Subscription> items) async {
    await LocalStorage.instance.writeSubscriptions(
      userId,
      jsonEncode(items.map((s) => s.toJson()).toList()),
    );
  }

  @override
  Future<List<Subscription>> getAll(String userId) => _readAll(userId);

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
  }) async {
    final items = await _readAll(userId);
    final sub = Subscription(
      id: _uuid.v4(),
      userId: userId,
      name: name.trim(),
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      notes: notes?.trim(),
      status: SubscriptionStatus.active,
      createdAt: DateTime.now().toUtc(),
    );
    items.add(sub);
    await _writeAll(userId, items);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    final items = await _readAll(updated.userId);
    final idx = items.indexWhere((s) => s.id == updated.id);
    if (idx != -1) items[idx] = updated;
    await _writeAll(updated.userId, items);
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {
    final items = await _readAll(userId);
    items.removeWhere((s) => s.id == subscriptionId);
    await _writeAll(userId, items);
  }

  @override
  Future<void> archive(String userId, String id) =>
      _setStatus(userId, id, SubscriptionStatus.archived);

  @override
  Future<void> restore(String userId, String id) =>
      _setStatus(userId, id, SubscriptionStatus.active);

  @override
  Future<void> pause(String userId, String id) =>
      _setStatus(userId, id, SubscriptionStatus.paused);

  @override
  Future<void> resume(String userId, String id) =>
      _setStatus(userId, id, SubscriptionStatus.active);

  @override
  Future<void> cancel(String userId, String id) =>
      _setStatus(userId, id, SubscriptionStatus.cancelled);

  Future<void> _setStatus(
      String userId, String id, SubscriptionStatus status) async {
    final items = await _readAll(userId);
    final idx = items.indexWhere((s) => s.id == id);
    if (idx != -1) items[idx] = items[idx].copyWith(status: status);
    await _writeAll(userId, items);
  }
}
