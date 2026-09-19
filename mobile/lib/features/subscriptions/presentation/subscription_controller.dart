import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../../../core/services/local_notification_service.dart';
import '../../../core/storage/local_storage.dart';
import '../../../core/utils/date_time_utils.dart';
import '../data/local_subscription_repository.dart';
import '../data/supabase_subscription_repository.dart';
import '../domain/subscription_models.dart';
import '../../notifications/domain/notification_rule.dart';
import '../../savings/data/savings_repository.dart';
import '../../stats/data/payment_events_repository.dart';

class SubscriptionController extends ChangeNotifier {
  static const _uuid = Uuid();

  SubscriptionController({
    required String userId,
    SubscriptionDataSource? repository,
    this.onUnauthorized,
  })  : _userId = userId,
        _repo = repository ??
            (EnvironmentConfig.isSupabaseConfigured
                ? SupabaseSubscriptionRepository()
                : LocalSubscriptionRepository()) {
    _startRealtimeSyncIfSupported();
  }

  final VoidCallback? onUnauthorized;

  final String _userId;
  final SubscriptionDataSource _repo;
  final _mutationQueue = OfflineMutationQueue();
  final _savingsRepo = SavingsRepository();
  final _paymentEventsRepo = PaymentEventsRepository();
  StreamSubscription<List<Subscription>>? _realtimeSub;

  List<Subscription> _items = [];
  bool _loading = false;
  bool _isOffline = false;
  String? _error;
  DateTime? _lastSyncAt;
  int _pendingMutationCount = 0;
  List<SavingsEvent> _savingsEvents = [];
  List<PaymentEvent> _paymentEvents = [];

  List<Subscription> get active => _items
      .where((s) => s.status == SubscriptionStatus.active && !s.isNotStarted)
      .toList()
    ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate));

  List<Subscription> get notStarted =>
      _items.where((s) => s.isNotStarted).toList()
        ..sort((a, b) => a.startDate.compareTo(b.startDate));

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

  List<(Subscription subscription, DateTime date)> projectedRenewals({
    int months = 12,
  }) {
    final result = <(Subscription, DateTime)>[];
    for (final subscription in active) {
      for (final date in subscription.projectedRenewals(count: months)) {
        result.add((subscription, date));
      }
    }
    result.sort((a, b) => a.$2.compareTo(b.$2));
    return result;
  }

  /// Tek bir [Money] değeri yalnızca TEK bir para birimini anlamlı şekilde
  /// temsil edebilir; birden fazla para birimi varsa (bkz. [totalsByCurrency]
  /// — asıl kullanılması gereken API budur) yalnızca listedeki ilk aktif
  /// aboneliğin para birimiyle eşleşenler toplanır. Farklı para birimlerinin
  /// minor unit'lerini birbirine eklemek (ör. 100 TRY + 20 USD = "120") hiçbir
  /// gerçek tutarı ifade etmez.
  Money get totalMonthly {
    if (active.isEmpty) return Money.zero;
    final primaryCurrency = active.first.currency;
    return active
        .where((s) => s.currency == primaryCurrency)
        .fold(Money.zero, (sum, s) => sum + s.monthlyAmount);
  }

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
      await _advanceOverdueRenewals();
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

  /// Yükleme sırasında gecikmiş (geçmiş tarihli) aktif aboneliklerin bir
  /// sonraki dönemini otomatik hesaplar (Test 45) — eski tarih listede
  /// kalmaz. Birden fazla dönem kaçırılmışsa [DateTimeUtils.nextOccurrenceOnOrAfter]
  /// hepsini tek adımda bugüne/sonrasına taşır.
  Future<void> _advanceOverdueRenewals() async {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final overdue = _items.where((s) {
      return s.status == SubscriptionStatus.active &&
          !s.isNotStarted &&
          s.nextRenewalDate.isBefore(today);
    }).toList();
    for (final subscription in overdue) {
      final advanced = subscription.copyWith(
        nextRenewalDate: DateTimeUtils.nextOccurrenceOnOrAfter(
          subscription.nextRenewalDate,
          subscription.billingCycle.key,
          today,
          originalAnchor: subscription.startDate,
        ),
      );
      final index = _items.indexWhere((s) => s.id == subscription.id);
      if (index != -1) _items[index] = advanced;
      try {
        await _repo.update(advanced);
      } on NetworkException {
        await _mutationQueue.enqueue(OfflineMutation(
          type: 'update',
          payload: advanced.toJson(),
          enqueuedAt: DateTime.now().toUtc(),
        ));
      } catch (_) {
        // Yerel durum ilerletilmiş kalır; sonraki senkron sunucuyla uzlaştırır.
      }
    }
  }

  /// Kullanıcının manuel olarak "Yenilendi" demesi için de kullanılabilir
  /// (ör. otomatik senkron henüz çalışmadan hemen geri bildirim istenirse);
  /// asıl otomatik ilerletme [_advanceOverdueRenewals] içindedir.
  Future<bool> markRenewed(String id) async {
    final current = _findById(id);
    if (current == null || current.status != SubscriptionStatus.active) {
      return false;
    }
    final now = DateTime.now();
    final tomorrow = DateTime(now.year, now.month, now.day + 1);
    final updated = current.copyWith(
      nextRenewalDate: DateTimeUtils.nextOccurrenceOnOrAfter(
        current.nextRenewalDate,
        current.billingCycle.key,
        tomorrow,
        originalAnchor: current.startDate,
      ),
    );
    return edit(updated);
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
      case 'create':
        // payload = offline sırasında oluşturulan geçici (local-...) id'li
        // Subscription'ın toJson()'ı. Sunucu gerçek id'yi atayınca, yerel
        // yer tutucuyu gerçek kayıtla DEĞİŞTİRİYORUZ (id değişir).
        final localSub = Subscription.fromJson(mutation.payload);
        final created = await _repo.create(
          userId: _userId,
          name: localSub.name,
          amount: localSub.amount,
          currency: localSub.currency,
          billingCycle: localSub.billingCycle,
          startDate: localSub.startDate,
          nextRenewalDate: localSub.nextRenewalDate,
          category: localSub.category,
          notes: localSub.notes,
          paymentMethod: localSub.paymentMethod,
          trialEndDate: localSub.trialEndDate,
          trialPriceAfter: localSub.trialPriceAfter,
        );
        // Not: _applyMutation, load()'un `_items = await _repo.getAll(...)`
        // adımından SONRA çalışır — sunucuda henüz var olmayan bu kayıt o
        // fetch'te dönmeyeceğinden, yerel geçici öğe `_items`'ta artık
        // bulunmayabilir. Bulunursa yerine koy, bulunamazsa (silinmişse) ekle.
        final createIdx = _items.indexWhere((s) => s.id == id);
        if (createIdx != -1) {
          _items[createIdx] = created;
        } else {
          _items.add(created);
        }
        await _mutationQueue.replaceSubscriptionId(localSub.id, created.id);
      case 'update':
        final updated = Subscription.fromJson(mutation.payload);
        final result = await _repo.update(updated);
        final updateIdx = _items.indexWhere((s) => s.id == result.id);
        if (updateIdx != -1) _items[updateIdx] = result;
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
    List<NotificationRule> notificationRules = const [],
  }) async {
    _setLoading(true);
    try {
      var sub = await _repo.create(
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
      if (notificationRules.isNotEmpty &&
          notificationRules.any((r) => r.daysBefore != 3 || !r.enabled)) {
        sub = await _repo
            .update(sub.copyWith(notificationRules: notificationRules));
      }
      _items.add(sub);
      _error = null;
      await _writeCache(_items);
      notifyListeners();
      return true;
    } on NetworkException {
      // Test 48: bağlantı yokken de abonelik eklenebilmeli. Geçici bir
      // local id ile İYİMSER (optimistic) olarak listeye ekliyoruz; bağlantı
      // gelince _applyMutation bunu gerçek sunucu kaydıyla değiştirecek.
      final localSub = Subscription(
        id: 'local-${_uuid.v4()}',
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
        notificationRules: notificationRules.isEmpty
            ? const [NotificationRule(daysBefore: 3)]
            : notificationRules,
        createdAt: DateTime.now().toUtc(),
      );
      _items.add(localSub);
      await _mutationQueue.enqueue(OfflineMutation(
        type: 'create',
        payload: localSub.toJson(),
        enqueuedAt: DateTime.now().toUtc(),
      ));
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
    } on NetworkException {
      // Test 48: bağlantı yokken de düzenleme kaybolmamalı — değişikliği
      // yerel olarak uyguluyor, sunucuya yazımı bağlantı gelince
      // _applyMutation'a bırakıyoruz.
      final idx = _items.indexWhere((s) => s.id == updated.id);
      if (idx != -1) _items[idx] = updated;
      await _mutationQueue.enqueue(OfflineMutation(
        type: 'update',
        payload: updated.toJson(),
        enqueuedAt: DateTime.now().toUtc(),
      ));
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

  /// Aboneliği kalıcı olarak siler (Test 18–21, 40). Sonraki listelemede
  /// görünmez ve bekleyen bildirimleri iptal edilir.
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
    await LocalNotificationService.cancelForSubscription(subscriptionId);
    _items.removeWhere((s) => s.id == subscriptionId);
    await _writeCache(_items);
    notifyListeners();
  }

  /// Toplu silme (Test 21). Tek [delete] çağrısını her id için tekrarlamak
  /// yerine ayrı bir metod: tüm silmeler bitene kadar tek bir
  /// `notifyListeners()`/cache yazımı yapılır ("tek seferde silinir"), ve bir
  /// id başarısız olsa bile diğerlerinin silinmesi durdurulmaz — hepsi
  /// denenir, başarısız olanlar [error] üzerinden özetlenir.
  Future<void> deleteMany(List<String> subscriptionIds) async {
    final failed = <String>[];
    for (final id in subscriptionIds) {
      try {
        await _repo.delete(_userId, id);
        _items.removeWhere((s) => s.id == id);
        await LocalNotificationService.cancelForSubscription(id);
      } on NetworkException {
        await _mutationQueue.enqueue(OfflineMutation(
          type: 'delete',
          payload: {'id': id},
          enqueuedAt: DateTime.now().toUtc(),
        ));
        _items.removeWhere((s) => s.id == id);
        await LocalNotificationService.cancelForSubscription(id);
      } catch (_) {
        failed.add(id);
      }
    }
    _error = failed.isEmpty
        ? null
        : '${failed.length} abonelik silinemedi, tekrar deneyin.';
    await _writeCache(_items);
    notifyListeners();
  }

  /// Toplu işlemde normal yaşam döngüsüne uygun seçenek fiziksel silme değil,
  /// arşivlemedir. Arşivlenen kayıtlar geçmişte kalır ve bildirimleri iptal
  /// edilir.
  Future<void> archiveMany(List<String> subscriptionIds) async {
    final failed = <String>[];
    for (final id in subscriptionIds) {
      final current = _findById(id);
      if (current == null ||
          !current.status.canTransitionTo(SubscriptionStatus.archived)) {
        failed.add(id);
        continue;
      }
      try {
        await _repo.archive(_userId, id);
      } on NetworkException {
        await _mutationQueue.enqueue(OfflineMutation(
          type: 'archive',
          payload: {'id': id},
          enqueuedAt: DateTime.now().toUtc(),
        ));
      } catch (_) {
        failed.add(id);
        continue;
      }
      _updateLocalStatus(id, SubscriptionStatus.archived);
      await LocalNotificationService.cancelForSubscription(id);
    }
    _error = failed.isEmpty
        ? null
        : '${failed.length} abonelik arşivlenemedi, tekrar deneyin.';
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

  /// Test 54: repo Supabase destekliyorsa, bu kullanıcının abonelik
  /// satırlarını Realtime üzerinden dinlemeye başlar — başka bir cihazdan
  /// yapılan değişiklikler manuel yenileme gerekmeden birkaç saniye içinde
  /// bu controller'a yansır. LocalSubscriptionRepository (çevrimdışı-yalnızca
  /// mod) veya test fake'leri bunu desteklemiyorsa sessizce hiçbir şey
  /// yapmaz — arayüz genişletilmedi, sadece Supabase'e özgü ek yetenek.
  void _startRealtimeSyncIfSupported() {
    final repo = _repo;
    if (repo is! SupabaseSubscriptionRepository) return;
    _realtimeSub = repo.watchAll(_userId).listen(
          _mergeRealtimeUpdate,
          onError:
              (_) {}, // bağlantı kopması sessizce yutulur; polling/manuel load() yedek olarak kalır
        );
  }

  /// Sunucudan gelen taze listeyi mevcut duruma birleştirir. Henüz sunucuya
  /// senkronize OLMAMIŞ yerel-öncelikli kayıtları (offline'da eklenmiş,
  /// "local-" id'li — bkz. [add]) KORUR; onları sunucu listesi henüz
  /// içermediği için kaybolmalarını önler.
  void _mergeRealtimeUpdate(List<Subscription> serverItems) {
    final pendingLocalOnly =
        _items.where((s) => s.id.startsWith('local-')).toList();
    _items = [...serverItems, ...pendingLocalOnly];
    unawaited(_writeCache(_items));
    notifyListeners();
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    super.dispose();
  }
}
