import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/token_provider.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../../../core/storage/local_storage.dart';
import '../data/api_subscription_repository.dart';
import '../data/subscription_repository.dart';
import '../data/supabase_subscription_repository.dart';
import '../domain/subscription_models.dart';

class SubscriptionController extends ChangeNotifier {
  SubscriptionController({
    required String userId,
    SubscriptionDataSource? repository,
    this.onUnauthorized,
  })  : _userId = userId,
        _repo = repository ??
            (EnvironmentConfig.isApiConfigured
                ? ApiSubscriptionRepository(
                    client: ApiClient(
                        tokenProvider: SupabaseTokenProvider()))
                : EnvironmentConfig.isSupabaseConfigured
                    ? SupabaseSubscriptionRepository()
                    : SubscriptionRepository());

  /// Called when the backend returns 401/403. Use this to trigger sign-out.
  final VoidCallback? onUnauthorized;

  final String _userId;
  final SubscriptionDataSource _repo;

  ApiSubscriptionRepository? get _apiRepo {
    final r = _repo;
    return r is ApiSubscriptionRepository ? r : null;
  }

  final _mutationQueue = OfflineMutationQueue();

  List<Subscription> _items = [];
  bool _loading = false;
  bool _isOffline = false;
  String? _error;
  String? _nextCursor;
  bool _hasMore = false;
  DateTime? _lastSyncAt;

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

  Money get totalMonthly =>
      active.fold(Money.zero, (sum, s) => sum + s.monthlyAmount);

  /// Aktif aboneliklerin para birimine göre aylık toplamları.
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
  bool get hasMore => _hasMore;
  /// UTC timestamp of the last successful data fetch. Null before first load.
  DateTime? get lastSyncAt => _lastSyncAt;

  Future<void> load() async {
    if (_loading) return; // dedup in-flight
    _setLoading(true);
    try {
      final api = _apiRepo;
      if (api != null) {
        final page = await api.getPaged();
        _items = page.items;
        _nextCursor = page.nextCursor;
        _hasMore = page.hasMore;
      } else {
        _items = await _repo.getAll(_userId);
        _nextCursor = null;
        _hasMore = false;
      }
      _isOffline = false;
      _error = null;
      _lastSyncAt = DateTime.now().toUtc();
      // Replay any mutations queued while offline.
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
      _setLoading(false);
    }
  }

  /// Replays mutations in FIFO order. A failed head stays in place so newer
  /// actions cannot overtake it and change the intended lifecycle outcome.
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
        // Keep the failed mutation at the head; retry on a later successful
        // sync instead of reordering it behind subsequent user actions.
        break;
      }
    }
    if (replayedAny) {
      await _writeCache(_items);
      notifyListeners();
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

  /// Load the next page when using the API repository.
  Future<void> loadMore() async {
    final api = _apiRepo;
    if (_loading || !_hasMore || api == null) return;
    _setLoading(true);
    try {
      final page = await api.getPaged(cursor: _nextCursor);
      _items = [..._items, ...page.items];
      _nextCursor = page.nextCursor;
      _hasMore = page.hasMore;
      _error = null;
      await _writeCache(_items);
    } catch (e) {
      if (e is AuthException) {
        onUnauthorized?.call();
        return;
      }
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
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

  Future<void> archive(String subscriptionId) => _updateStatus(
        subscriptionId, SubscriptionStatus.archived,
        () => _repo.archive(_userId, subscriptionId),
        mutationType: 'archive');

  Future<void> restore(String subscriptionId) => _updateStatus(
        subscriptionId, SubscriptionStatus.active,
        () => _repo.restore(_userId, subscriptionId),
        mutationType: 'restore');

  Future<void> pause(String subscriptionId) => _updateStatus(
        subscriptionId, SubscriptionStatus.paused,
        () => _repo.pause(_userId, subscriptionId),
        mutationType: 'pause');

  Future<void> resume(String subscriptionId) => _updateStatus(
        subscriptionId, SubscriptionStatus.active,
        () => _repo.resume(_userId, subscriptionId),
        mutationType: 'resume');

  Future<void> cancel(String subscriptionId) => _updateStatus(
        subscriptionId, SubscriptionStatus.cancelled,
        () => _repo.cancel(_userId, subscriptionId),
        mutationType: 'cancel');

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> _updateStatus(
    String id,
    SubscriptionStatus status,
    Future<void> Function() repoCall, {
    required String mutationType,
  }) async {
    final idx = _items.indexWhere((s) => s.id == id);
    if (idx != -1 && !_items[idx].status.canTransitionTo(status)) {
      // TODO(i18n): replace with localized string key before multi-locale release.
      throw ValidationException(
          'status_transition_unsupported:${_items[idx].status.key}:${status.key}');
    }
    try {
      await repoCall();
    } on NetworkException {
      // Offline: apply optimistically and queue for later.
      await _mutationQueue.enqueue(OfflineMutation(
        type: mutationType,
        payload: {'id': id},
        enqueuedAt: DateTime.now().toUtc(),
      ));
    }
    if (idx != -1) _items[idx] = _items[idx].copyWith(status: status);
    await _writeCache(_items);
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
