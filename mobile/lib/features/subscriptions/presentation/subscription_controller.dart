import 'package:flutter/foundation.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../data/subscription_repository.dart';
import '../data/supabase_subscription_repository.dart';
import '../domain/subscription_models.dart';

class SubscriptionController extends ChangeNotifier {
  SubscriptionController({
    required String userId,
    SubscriptionDataSource? repository,
  })  : _userId = userId,
        _repo = repository ??
            (EnvironmentConfig.isSupabaseConfigured
                ? SupabaseSubscriptionRepository()
                : SubscriptionRepository());

  final String _userId;
  final SubscriptionDataSource _repo;

  List<Subscription> _items = [];
  bool _loading = false;
  String? _error;

  List<Subscription> get active =>
      _items.where((s) => s.status == SubscriptionStatus.active).toList()
        ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate));

  List<Subscription> get paused =>
      _items.where((s) => s.status == SubscriptionStatus.paused).toList();

  List<Subscription> get cancelled =>
      _items.where((s) => s.status == SubscriptionStatus.cancelled).toList();

  List<Subscription> get archived =>
      _items.where((s) => s.status == SubscriptionStatus.archived).toList();

  List<Subscription> get upcomingRenewals => active
      .where((s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 30)
      .toList();

  double get totalMonthly =>
      active.fold(0.0, (sum, s) => sum + s.monthlyAmount);

  /// Aktif aboneliklerin para birimine göre aylık toplamları.
  Map<String, double> get totalsByCurrency {
    final map = <String, double>{};
    for (final s in active) {
      map[s.currency] = (map[s.currency] ?? 0) + s.monthlyAmount;
    }
    return map;
  }

  bool get loading => _loading;
  String? get error => _error;

  Future<void> load() async {
    _setLoading(true);
    try {
      _items = await _repo.getAll(_userId);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> add({
    required String name,
    required double amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
  }) async {
    _setLoading(true);
    try {
      final sub = await _repo.create(
        userId: _userId,
        name: name,
        amount: amount,
        currency: currency,
        billingCycle: billingCycle,
        startDate: startDate,
        nextRenewalDate: nextRenewalDate,
        category: category,
        notes: notes,
      );
      _items.add(sub);
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> edit(Subscription updated) async {
    _setLoading(true);
    try {
      final result = await _repo.update(updated);
      final idx = _items.indexWhere((s) => s.id == result.id);
      if (idx != -1) _items[idx] = result;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> delete(String subscriptionId) async {
    await _repo.delete(_userId, subscriptionId);
    _items.removeWhere((s) => s.id == subscriptionId);
    notifyListeners();
  }

  Future<void> archive(String subscriptionId) =>
      _updateStatus(subscriptionId, SubscriptionStatus.archived,
          () => _repo.archive(_userId, subscriptionId));

  Future<void> restore(String subscriptionId) =>
      _updateStatus(subscriptionId, SubscriptionStatus.active,
          () => _repo.restore(_userId, subscriptionId));

  Future<void> pause(String subscriptionId) =>
      _updateStatus(subscriptionId, SubscriptionStatus.paused,
          () => _repo.pause(_userId, subscriptionId));

  Future<void> resume(String subscriptionId) =>
      _updateStatus(subscriptionId, SubscriptionStatus.active,
          () => _repo.resume(_userId, subscriptionId));

  Future<void> cancel(String subscriptionId) =>
      _updateStatus(subscriptionId, SubscriptionStatus.cancelled,
          () => _repo.cancel(_userId, subscriptionId));

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> _updateStatus(String id, SubscriptionStatus status,
      Future<void> Function() repoCall) async {
    await repoCall();
    final idx = _items.indexWhere((s) => s.id == id);
    if (idx != -1) _items[idx] = _items[idx].copyWith(status: status);
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
