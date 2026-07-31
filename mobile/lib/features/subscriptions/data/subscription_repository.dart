import 'dart:convert';
import 'package:uuid/uuid.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/subscription_models.dart';

// Supabase'e geçince bu sınıfın içi değişir, imzalar aynı kalır.
class SubscriptionRepository {
  SubscriptionRepository({LocalStorage? storage})
      : _storage = storage ?? LocalStorage.instance;

  final LocalStorage _storage;
  static const _uuid = Uuid();

  Future<List<Subscription>> getAll(String userId) async {
    final raw = await _storage.readSubscriptions(userId);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Subscription> create({
    required String userId,
    required String name,
    required double amount,
    required String currency,
    required BillingCycle billingCycle,
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

  Future<Subscription> update(Subscription updated) async {
    final list = await getAll(updated.userId);
    final idx = list.indexWhere((s) => s.id == updated.id);
    if (idx == -1) throw const NotFoundException('Abonelik bulunamadı.');
    list[idx] = updated;
    await _persist(updated.userId, list);
    return updated;
  }

  Future<void> delete(String userId, String subscriptionId) async {
    final list = await getAll(userId);
    list.removeWhere((s) => s.id == subscriptionId);
    await _persist(userId, list);
  }

  Future<void> archive(String userId, String subscriptionId) async {
    final list = await getAll(userId);
    final idx = list.indexWhere((s) => s.id == subscriptionId);
    if (idx == -1) throw const NotFoundException('Abonelik bulunamadı.');
    list[idx] = list[idx].copyWith(isArchived: true);
    await _persist(userId, list);
  }

  Future<void> restore(String userId, String subscriptionId) async {
    final list = await getAll(userId);
    final idx = list.indexWhere((s) => s.id == subscriptionId);
    if (idx == -1) throw const NotFoundException('Abonelik bulunamadı.');
    list[idx] = list[idx].copyWith(isArchived: false);
    await _persist(userId, list);
  }

  Future<void> _persist(String userId, List<Subscription> list) =>
      _storage.writeSubscriptions(
        userId,
        jsonEncode(list.map((s) => s.toJson()).toList()),
      );
}
