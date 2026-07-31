import 'dart:convert';
import 'package:uuid/uuid.dart';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/subscription_models.dart';

class SubscriptionRepository implements SubscriptionDataSource {
  SubscriptionRepository({LocalStorage? storage})
      : _storage = storage ?? LocalStorage.instance;

  final LocalStorage _storage;
  static const _uuid = Uuid();

  @override
  Future<List<Subscription>> getAll(String userId) async {
    final raw = await _storage.readSubscriptions(userId);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
        .toList();
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
    if (name.trim().isEmpty) {
      throw const ValidationException('Abonelik adı boş olamaz.');
    }
    if (amount <= 0) {
      throw const ValidationException('Tutar sıfırdan büyük olmalı.');
    }

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
      createdAt: DateTime.now(),
    );

    final list = await getAll(userId);
    list.add(sub);
    await _persist(userId, list);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    final list = await getAll(updated.userId);
    final idx = list.indexWhere((s) => s.id == updated.id);
    if (idx == -1) throw const NotFoundException('Abonelik bulunamadı.');
    list[idx] = updated;
    await _persist(updated.userId, list);
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async {
    final list = await getAll(userId);
    list.removeWhere((s) => s.id == subscriptionId);
    await _persist(userId, list);
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

  Future<void> _setStatus(
      String userId, String id, SubscriptionStatus status) async {
    final list = await getAll(userId);
    final idx = list.indexWhere((s) => s.id == id);
    if (idx == -1) throw const NotFoundException('Abonelik bulunamadı.');
    list[idx] = list[idx].copyWith(status: status);
    await _persist(userId, list);
  }

  Future<void> _persist(String userId, List<Subscription> list) =>
      _storage.writeSubscriptions(
        userId,
        jsonEncode(list.map((s) => s.toJson()).toList()),
      );
}
