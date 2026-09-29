import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_messages.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../../../core/services/notification_scheduler.dart';
import '../data/local_subscription_repository.dart';
import '../data/offline_sync_coordinator.dart';
import '../data/subscription_operations.dart';
import '../data/subscription_realtime_sync.dart';
import '../data/subscription_status_operations.dart';
import '../data/payment_history_store.dart';
import '../data/subscription_cache.dart';
import '../data/supabase_subscription_repository.dart';
import '../domain/subscription_models.dart';
import '../domain/subscription_selectors.dart';
import '../../notifications/domain/notification_rule.dart';
import '../../savings/domain/savings_event.dart';
import '../../stats/domain/payment_event.dart';

class SubscriptionController extends ChangeNotifier {
  static const _pageSize = 50;

  SubscriptionController({
    required String userId,
    SubscriptionDataSource? repository,
    OfflineMutationQueue? mutationQueue,
    SubscriptionCache? cache,
    PaymentHistoryStore? paymentHistory,
    NotificationScheduler? notifications,
    this.onUnauthorized,
  })  : _userId = userId,
        _notifications = notifications ?? NoopNotificationScheduler(),
        _repo = repository ??
            (EnvironmentConfig.isSupabaseConfigured
                ? SupabaseSubscriptionRepository()
                : LocalSubscriptionRepository()),
        _cache = cache ?? SubscriptionCache(userId),
        _history = paymentHistory ?? PaymentHistoryStore(userId: userId) {
    _sync = OfflineSyncCoordinator(
      repository: _repo,
      queue: mutationQueue ?? OfflineMutationQueue(),
      userId: userId,
      items: () => _items,
    );
    _ops = SubscriptionOperations(
      host: _ControllerHost(this),
      repository: _repo,
      sync: _sync,
      cache: _cache,
      notifications: _notifications,
      userId: userId,
    );
    _status = SubscriptionStatusOperations(
      host: _ControllerHost(this),
      repository: _repo,
      sync: _sync,
      cache: _cache,
      history: _history,
      notifications: _notifications,
      userId: userId,
      findById: _ops.findById,
    );
    _realtime = SubscriptionRealtimeSync.tryStart(_repo, userId, (server) {
      _items = SubscriptionRealtimeSync.merge(_items, server);
      unawaited(_cache.write(_items));
      notifyListeners();
    });
  }

  final VoidCallback? onUnauthorized;

  final String _userId;
  final SubscriptionDataSource _repo;
  final SubscriptionCache _cache;
  final PaymentHistoryStore _history;
  final NotificationScheduler _notifications;
  late final OfflineSyncCoordinator _sync;
  late final SubscriptionOperations _ops;
  late final SubscriptionStatusOperations _status;
  SubscriptionRealtimeSync? _realtime;

  List<Subscription> _items = [];
  late SubscriptionSelectors _selectors = SubscriptionSelectors(_items);
  bool _loading = false;
  bool _isOffline = false;
  String? _error;
  DateTime? _lastSyncAt;
  int _pendingMutationCount = 0;
  int _visibleLimit = _pageSize;

  @override
  void notifyListeners() {
    _selectors = SubscriptionSelectors(_items);
    super.notifyListeners();
  }

  List<Subscription> get active => _selectors.active;
  List<Subscription> get notStarted => _selectors.notStarted;
  List<Subscription> get trials => _selectors.trials;
  List<Subscription> get paused => _selectors.paused;
  List<Subscription> get cancelled => _selectors.cancelled;
  List<Subscription> get expired => _selectors.expired;
  List<Subscription> get archived => _selectors.archived;

  List<Subscription> get allItems => List.unmodifiable(_items);
  List<Subscription> _page(List<Subscription> items) =>
      items.take(_visibleLimit).toList();
  List<Subscription> get visibleActive => _page(active);
  List<Subscription> get visibleTrials => _page(trials);
  List<Subscription> get visiblePaused => _page(paused);
  List<Subscription> get visibleCancelled => _page(cancelled);
  List<Subscription> get visibleExpired => _page(expired);

  List<Subscription> get upcomingRenewals => _selectors.upcomingRenewals;

  List<(Subscription subscription, DateTime date)> projectedRenewals({
    int months = 12,
  }) =>
      _selectors.projectedRenewals(months: months);

  /// Yalnızca ilk aktif aboneliğin para birimini toplar; çoklu para birimi
  /// için [totalsByCurrency] kullanılmalıdır.
  Money get totalMonthly => _selectors.totalMonthly;
  Map<String, Money> get totalsByCurrency => _selectors.totalsByCurrency;

  bool get loading => _loading;
  bool get isOffline => _isOffline;
  String? get error => _error;
  DateTime? get lastSyncAt => _lastSyncAt;
  int get pendingMutationCount => _pendingMutationCount;
  List<SavingsEvent> get savingsEvents => _history.savingsEvents;
  List<PaymentEvent> get paymentEvents => _history.paymentEvents;
  Map<String, Money> get savingsByCurrency => _history.savingsByCurrency;

  Future<bool> recordPayment({
    required String subscriptionId,
    required Money amount,
    required String currency,
    DateTime? paidAt,
  }) =>
      _ops.guarded(() => _history.record(
            subscriptionId: subscriptionId,
            amount: amount,
            currency: currency,
            paidAt: paidAt ?? DateTime.now(),
          ));

  Future<bool> deletePayment(String id) =>
      _ops.guarded(() => _history.remove(id));

  Future<bool> updatePayment({required PaymentEvent event}) =>
      _ops.guarded(() => _history.update(event));

  bool get hasMore => _visibleLimit < _items.length;
  Future<void> loadMore() async {
    if (!hasMore) return;
    _visibleLimit = (_visibleLimit + _pageSize).clamp(0, _items.length);
    notifyListeners();
  }

  Future<void> load() async {
    if (_loading) return;
    _setLoading(true);
    _pendingMutationCount = await _sync.pendingCount;
    notifyListeners();
    try {
      _items = await _repo.getAll(_userId);
      _visibleLimit = _pageSize;
      await _history.load();
      await _ops.applyLifecycleRules();
      _isOffline = false;
      _error = null;
      _lastSyncAt = DateTime.now().toUtc();
      if (await _sync.replay()) {
        await _cache.write(_items);
        notifyListeners();
      }
      await _cache.write(_items);
    } catch (e) {
      if (e is AuthException) {
        onUnauthorized?.call();
        return;
      }
      final cached = await _cache.read();
      if (cached != null) {
        _items = cached;
        _isOffline = true;
        _error = null;
      } else {
        _isOffline = false;
        _error = userMessageFor(e);
      }
    } finally {
      _pendingMutationCount = await _sync.pendingCount;
      _setLoading(false);
    }
  }

  Future<bool> markRenewed(String id) => _ops.markRenewed(id);

  /// Kullanıcı ödeme yaptığını onayladığında ödeme geçmişine manuel kayıt
  /// ekler ve aboneliğin bir sonraki yenilemesini ileri taşır. Bu işlem hiçbir
  /// banka/kart tahsilatı yapmaz.
  Future<bool> markPaidAndRenewed(String id) async {
    final current = _ops.findById(id);
    if (current == null || current.status != SubscriptionStatus.active) {
      return false;
    }
    final recorded = await recordPayment(
      subscriptionId: id,
      amount: current.amount,
      currency: current.currency,
    );
    if (!recorded) return false;
    return markRenewed(id);
  }

  // ── Yazma işlemleri: SubscriptionOperations'a yönlendirilir ───────────────

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
    List<NotificationRule> notificationRules = const [],
  }) =>
      _ops.add(
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
        notificationRules: notificationRules,
      );

  Future<bool> edit(Subscription updated) => _ops.edit(updated);
  Future<void> delete(String subscriptionId) => _ops.delete(subscriptionId);
  Future<void> deleteMany(List<String> ids) => _status.deleteMany(ids);
  Future<void> archiveMany(List<String> ids) => _status.archiveMany(ids);
  Future<void> archive(String id) => _status.archive(id);
  Future<void> restore(String id) => _status.restore(id);
  Future<void> pause(String id) => _status.pause(id);
  Future<void> resume(String id) => _status.resume(id);
  Future<void> cancel(String id) => _status.cancel(id);

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _realtime?.cancel();
    super.dispose();
  }
}

/// [SubscriptionOperations]'ın controller durumuna eriştiği dar köprü.
class _ControllerHost implements SubscriptionHost {
  _ControllerHost(this._controller);

  final SubscriptionController _controller;

  @override
  List<Subscription> get items => _controller._items;

  @override
  set error(String? value) => _controller._error = value;

  @override
  void setLoading(bool value) => _controller._setLoading(value);

  @override
  void notify() => _controller.notifyListeners();
}
