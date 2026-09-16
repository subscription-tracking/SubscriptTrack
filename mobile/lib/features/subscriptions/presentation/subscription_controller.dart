import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../../../core/storage/local_storage.dart';
import '../data/local_subscription_repository.dart';
import '../data/supabase_subscription_repository.dart';
import '../domain/subscription_models.dart';
import '../../savings/data/savings_repository.dart';
import '../../stats/data/payment_events_repository.dart';

class SubscriptionController extends ChangeNotifier {
  SubscriptionController({
    required String userId,
    SubscriptionDataSource? repository,
    this.onUnauthorized,
  })  : _userId = userId,
        _repo = repository ??
            (EnvironmentConfig.isSupabaseConfigured
                ? SupabaseSubscriptionRepository()
                : LocalSubscriptionRepository());

  final VoidCallback? onUnauthorized;

  final String _userId;
  final SubscriptionDataSource _repo;
  final _mutationQueue = OfflineMutationQueue();
  final _savingsRepo = SavingsRepository();
  final _paymentEventsRepo = PaymentEventsRepository();

  List<Subscription> _items = [];
  bool _loading = false;
  bool _isOffline = false;
  String? _error;
  DateTime? _lastSyncAt;
  int _pendingMutationCount = 0;
  List<SavingsEvent> _savingsEvents = [];
  List<PaymentEvent> _paymentEvents = [];

  List<Subscription> get active =>
      _items.where((s) => s.status == SubscriptionStatus.active).toList()
        ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate));

  List<Subscription> get trials =>
      _items.where((s) => s.status == SubscriptionStatus.trial).toList()
        ..sort((a, b) => (a.trialEndDate ?? a.nextRenewalDate)
            .compareTo(b.trialEndDate ?? b.nextRenewalDate));

  List<Subscription> get paused =>
      _items.where((s) => s.status == SubscriptionStatus.paused).toList();

  List<Subscription> get cancelled =>
      _items.where((s) => s.status == SubscriptionStatus.cancelled).toList();

  List<Subscription> get expired =>
      _items.where((s) => s.status == SubscriptionStatus.expired).toList();

  List<Subscription> get archived =>
      _items.where((s) => s.status == SubscriptionStatus.archived).toList();

  List<Subscription> get allItems => List.unmodifiable(_items);

  List<Subscription> get upcomingRenewals => active
      .where((s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 30)
      .toList();

  Money get totalMonthly =>
      active.fold(Money.zero, (sum, s) => sum + s.monthlyAmount);

  Map<String, Money> get totalsByCurrency {
    final map = <String, Money>{};
    for (final s in active) {
      final curr = map[s.currency];
      map[s.currency] = curr == null ? s.monthlyAmount : curr + s.monthlyAmount;
    }
    return map;
  }

  bool get loading => _loading;
  bool get isOffline => _isOffline;
  String? get error => _error;
  DateTime? get lastSyncAt => _lastSyncAt;
  int get pendingMutationCount => _pendingMutationCount;
  List<SavingsEvent> get savingsEvents => List.unmodifiable(_savingsEvents);
  List<PaymentEvent> get paymentEvents => List.unmodifiable(_paymentEvents);

  Future<bool> recordPayment({
    required String subscriptionId,
    required double amount,
    required String currency,
    DateTime? paidAt,
  }) async {
    try {
      final event = await _paymentEventsRepo.record(
        userId: _userId,
        subscriptionId: subscriptionId,
        amount: amount,
        currency: currency,
        paidAt: paidAt ?? DateTime.now(),
      );
      _paymentEvents = [event, ..._paymentEvents];
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  Map<String, Money> get savingsByCurrency {
    final result = <String, Money>{};
    for (final event in _savingsEvents) {
      final current = result[event.currency];
      result[event.currency] = current == null
          ? Money.parse(event.annualAmount.toStringAsFixed(2))
          : current + Money.parse(event.annualAmount.toStringAsFixed(2));
    }
    return result;
  }

  // Supabase loads all items at once — no pagination.
  bool get hasMore => false;
  Future<void> loadMore() async {}

  Future<void> load() async {
    if (_loading) return;
    _setLoading(true);
    _pendingMutationCount = await _mutationQueue.length;
    notifyListeners();
    try {
      _items = await _repo.getAll(_userId);
      // Optional datasets must not force the primary dashboard into offline
      // mode when one secondary table is unavailable.
      try {
        _savingsEvents = await _savingsRepo.fetch(_userId);
      } catch (_) {
        _savingsEvents = [];
      }
      try {
        _paymentEvents = await _paymentEventsRepo.fetch(_userId);
      } catch (_) {
        _paymentEvents = [];
      }
      await _expireEndedTrials();
      _isOffline = false;
      _error = null;
      _lastSyncAt = DateTime.now().toUtc();
      await _replayOfflineQueue();
      await _writeCache(_items);
    } catch (e) {
      if (e is AuthException) {
        onUnauthorized?.call();
        return;
      }
      final cached = await _readCache();
      if (cached != null) {
        _items = cached;
        _isOffline = true;
        _error = null;
      } else {
        _isOffline = false;
        _error = e.toString();
      }
    } finally {
      _pendingMutationCount = await _mutationQueue.length;
      _setLoading(false);
    }
  }

  Future<void> _replayOfflineQueue() async {
    var replayedAny = false;
    while (true) {
      final mutation = await _mutationQueue.peek();
      if (mutation == null) break;
      try {
        await _applyMutation(mutation);
        await _mutationQueue.removeFirst();
        replayedAny = true;
      } catch (_) {
        break;
      }
    }
    if (replayedAny) {
      await _writeCache(_items);
      notifyListeners();
    }
  }

  Future<void> _expireEndedTrials() async {
    final today = DateTime.now();
    final ended = _items.where((s) {
      final end = s.trialEndDate;
      return s.status == SubscriptionStatus.trial &&
          end != null &&
          DateTime(end.year, end.month, end.day)
              .isBefore(DateTime(today.year, today.month, today.day));
    }).toList();
    for (final subscription in ended) {
      final expired = subscription.copyWith(status: SubscriptionStatus.expired);
      final index = _items.indexWhere((s) => s.id == subscription.id);
      if (index != -1) _items[index] = expired;
      try {
        await _repo.update(expired);
      } on NetworkException {
        await _mutationQueue.enqueue(OfflineMutation(
          type: 'expire',
          payload: {'id': subscription.id},
          enqueuedAt: DateTime.now().toUtc(),
        ));
      } catch (_) {
        // Keep the local state expired; the next sync can reconcile the server.
      }
    }
  }

  Future<void> _applyMutation(OfflineMutation mutation) async {
    final id = mutation.payload['id'] as String?;
    if (id == null) {
      throw StateError('Offline mutation has no subscription id.');
    }
    switch (mutation.type) {
      case 'pause':
        await _repo.pause(_userId, id);
        _updateLocalStatus(id, SubscriptionStatus.paused);
      case 'resume':
        await _repo.resume(_userId, id);
        _updateLocalStatus(id, SubscriptionStatus.active);
      case 'cancel':
        await _repo.cancel(_userId, id);
        _updateLocalStatus(id, SubscriptionStatus.cancelled);
      case 'archive':
        await _repo.archive(_userId, id);
        _updateLocalStatus(id, SubscriptionStatus.archived);
      case 'restore':
        await _repo.restore(_userId, id);
        _updateLocalStatus(id, SubscriptionStatus.active);
      case 'delete':
        await _repo.delete(_userId, id);
        _items.removeWhere((s) => s.id == id);
      default:
        throw StateError('Unsupported offline mutation: ${mutation.type}');
    }
  }

  void _updateLocalStatus(String id, SubscriptionStatus status) {
    final idx = _items.indexWhere((s) => s.id == id);
    if (idx != -1) _items[idx] = _items[idx].copyWith(status: status);
  }

  Future<void> _writeCache(List<Subscription> items) async {
    try {
      final json = jsonEncode(items.map((s) => s.toJson()).toList());
      await LocalStorage.instance.writeSubscriptions('cache_$_userId', json);
    } catch (_) {}
  }

  Future<List<Subscription>?> _readCache() async {
    try {
      final raw =
          await LocalStorage.instance.readSubscriptions('cache_$_userId');
      if (raw == null) return null;
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return null;
    }
  }

  Future<bool> add({
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
        paymentMethod: paymentMethod,
        trialEndDate: trialEndDate,
        trialPriceAfter: trialPriceAfter,
      );
      _items.add(sub);
      _error = null;
      await _writeCache(_items);
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
      await _writeCache(_items);
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
    try {
      await _repo.delete(_userId, subscriptionId);
    } on NetworkException {
      await _mutationQueue.enqueue(OfflineMutation(
        type: 'delete',
        payload: {'id': subscriptionId},
        enqueuedAt: DateTime.now().toUtc(),
      ));
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
    _items.removeWhere((s) => s.id == subscriptionId);
    await _writeCache(_items);
    notifyListeners();
  }

  Future<void> archive(String id) => _updateStatus(
      id, SubscriptionStatus.archived, () => _repo.archive(_userId, id),
      mutationType: 'archive');

  Future<void> restore(String id) => _updateStatus(
      id, SubscriptionStatus.active, () => _repo.restore(_userId, id),
      mutationType: 'restore');

  Future<void> pause(String id) {
    final sub = _findById(id);
    return _updateStatus(
      id,
      SubscriptionStatus.paused,
      () => _repo.pause(_userId, id),
      mutationType: 'pause',
      onSuccess: sub == null
          ? null
          : () => _savingsRepo.record(
                userId: _userId,
                subscriptionId: id,
                eventType: 'PAUSED',
                monthlyAmount: sub.monthlyAmount.amount,
                annualAmount: (sub.monthlyAmount * 12).amount,
                currency: sub.currency,
              ),
    );
  }

  Future<void> resume(String id) => _updateStatus(
      id, SubscriptionStatus.active, () => _repo.resume(_userId, id),
      mutationType: 'resume');

  Future<void> cancel(String id) {
    final sub = _findById(id);
    return _updateStatus(
      id,
      SubscriptionStatus.cancelled,
      () => _repo.cancel(_userId, id),
      mutationType: 'cancel',
      onSuccess: sub == null
          ? null
          : () => _savingsRepo.record(
                userId: _userId,
                subscriptionId: id,
                eventType: 'CANCELLED',
                monthlyAmount: sub.monthlyAmount.amount,
                annualAmount: (sub.monthlyAmount * 12).amount,
                currency: sub.currency,
              ),
    );
  }

  Subscription? _findById(String id) {
    final idx = _items.indexWhere((s) => s.id == id);
    return idx != -1 ? _items[idx] : null;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> _updateStatus(
    String id,
    SubscriptionStatus status,
    Future<void> Function() repoCall, {
    required String mutationType,
    Future<void> Function()? onSuccess,
  }) async {
    final idx = _items.indexWhere((s) => s.id == id);
    if (idx != -1 && !_items[idx].status.canTransitionTo(status)) {
      throw ValidationException(
          'status_transition_unsupported:${_items[idx].status.key}:${status.key}');
    }
    var succeeded = false;
    try {
      await repoCall();
      succeeded = true;
    } on NetworkException {
      await _mutationQueue.enqueue(OfflineMutation(
        type: mutationType,
        payload: {'id': id},
        enqueuedAt: DateTime.now().toUtc(),
      ));
    }
    // Record side-effects only when the server call succeeded (not queued offline).
    if (succeeded && onSuccess != null) await onSuccess();
    if (idx != -1) _items[idx] = _items[idx].copyWith(status: status);
    await _writeCache(_items);
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
