import 'package:flutter/foundation.dart';

import '../data/subscription_repository.dart';
import '../domain/subscription_models.dart';

class SubscriptionController extends ChangeNotifier {
  SubscriptionController({
    required String userId,
    SubscriptionRepository? repository,
  })  : _userId = userId,
        _repo = repository ?? SubscriptionRepository();

  final String _userId;
  final SubscriptionRepository _repo;

  List<Subscription> _items = [];
  bool _loading = false;
  String? _error;

  List<Subscription> get active =>
      _items.where((s) => !s.isArchived).toList()
        ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate));

  List<Subscription> get archived =>
      _items.where((s) => s.isArchived).toList();

  List<Subscription> get upcomingRenewals => active
      .where((s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 30)
      .toList();

  double get totalMonthly =>
      active.fold(0.0, (sum, s) => sum + s.monthlyAmount);

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
      _loading = false;
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
      _loading = false;
    }
  }

  Future<void> delete(String subscriptionId) async {
    await _repo.delete(_userId, subscriptionId);
    _items.removeWhere((s) => s.id == subscriptionId);
    notifyListeners();
  }

  Future<void> archive(String subscriptionId) async {
    await _repo.archive(_userId, subscriptionId);
    final idx = _items.indexWhere((s) => s.id == subscriptionId);
    if (idx != -1) _items[idx] = _items[idx].copyWith(isArchived: true);
    notifyListeners();
  }

  Future<void> restore(String subscriptionId) async {
    await _repo.restore(_userId, subscriptionId);
    final idx = _items.indexWhere((s) => s.id == subscriptionId);
    if (idx != -1) _items[idx] = _items[idx].copyWith(isArchived: false);
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
