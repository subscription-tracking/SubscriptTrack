import 'dart:async';

import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/domain/money.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_messages.dart';
import '../../../core/services/notification_scheduler.dart';
import '../../notifications/domain/notification_rule.dart';
import '../domain/subscription_lifecycle.dart';
import '../domain/subscription_models.dart';
import 'offline_sync_coordinator.dart';
import 'subscription_cache.dart';
import 'package:uuid/uuid.dart';

/// [SubscriptionOperations]'ın durumunu paylaştığı ev sahibi (controller).
abstract interface class SubscriptionHost {
  /// Controller'ın o anki abonelik listesi; işlemler yerinde değiştirir.
  List<Subscription> get items;
  set error(String? value);
  void setLoading(bool value);
  void notify();
}

/// Abonelik yazma işlemleri: ekleme, düzenleme, silme, arşivleme ve durum
/// geçişleri. Bağlantı yokken değişiklik iyimser uygulanır ve kuyruğa alınır.
class SubscriptionOperations {
  SubscriptionOperations({
    required SubscriptionHost host,
    required SubscriptionDataSource repository,
    required OfflineSyncCoordinator sync,
    required SubscriptionCache cache,
    required NotificationScheduler notifications,
    required String userId,
  })  : _host = host,
        _repo = repository,
        _sync = sync,
        _cache = cache,
        _notifications = notifications,
        _userId = userId;

  static const _uuid = Uuid();

  final SubscriptionHost _host;
  final SubscriptionDataSource _repo;
  final OfflineSyncCoordinator _sync;
  final SubscriptionCache _cache;
  final NotificationScheduler _notifications;
  final String _userId;

  Subscription? findById(String id) {
    final idx = _host.items.indexWhere((s) => s.id == id);
    return idx != -1 ? _host.items[idx] : null;
  }

  /// Yerel değişikliği listeye uygular ve sunucuya yazar. Bağlantı yoksa tam
  /// abonelik anlık görüntüsüyle 'update' mutasyonu kuyruğa alınır; diğer
  /// hatalarda yerel durum korunur ve sonraki senkron sunucuyla uzlaştırır.
  Future<void> _applyLocalChange(Subscription updated) async {
    final index = _host.items.indexWhere((s) => s.id == updated.id);
    if (index != -1) _host.items[index] = updated;
    try {
      await _repo.update(updated);
    } on NetworkException {
      await _sync.enqueue('update', updated.toJson());
    } catch (e) {
      // Yerel durum ilerletilmiş kalır; sonraki senkron sunucuyla uzlaştırır.
      logIgnoredError('SubscriptionOperations._applyLocalChange', e);
    }
  }

  /// Deneme bitiş günü geçen abonelikleri "expired" yapar.
  Future<void> _expireEndedTrials() async {
    for (final s in SubscriptionLifecycle.endedTrials(_host.items)) {
      await _applyLocalChange(s.copyWith(status: SubscriptionStatus.expired));
    }
  }

  /// Yükleme sırasında gecikmiş aktif aboneliklerin bir sonraki dönemini
  /// otomatik hesaplar (Test 45) — eski tarih listede kalmaz.
  Future<void> _advanceOverdueRenewals() async {
    for (final s in SubscriptionLifecycle.overdueRenewals(_host.items)) {
      await _applyLocalChange(SubscriptionLifecycle.advanceOverdue(s));
    }
  }

  /// Deneme bitişi ve gecikmiş yenileme kurallarını uygular (yükleme sırasında).
  Future<void> applyLifecycleRules() async {
    await _expireEndedTrials();
    await _advanceOverdueRenewals();
  }

  /// Ödeme geçmişi gibi ikincil işlemleri ortak hata/bildirim akışıyla
  /// çalıştırır; başarıda `true`, hatada kullanıcı mesajıyla `false` döner.
  Future<bool> guarded(Future<void> Function() op) async {
    try {
      await op();
      _host.error = null;
      _host.notify();
      return true;
    } catch (e) {
      _host.error = userMessageFor(e);
      _host.notify();
      return false;
    }
  }

  /// Kullanıcının manuel olarak "Yenilendi" demesi; sonraki yenilemeyi yarına
  /// veya sonrasına taşır. Otomatik ilerletme [applyLifecycleRules] içindedir.
  Future<bool> markRenewed(String id) async {
    final current = findById(id);
    if (current == null || current.status != SubscriptionStatus.active) {
      return false;
    }
    return edit(SubscriptionLifecycle.markRenewed(current));
  }

  /// Test 12: art arda hızlıca tetiklenen `add()` çağrılarının (ör. çift
  /// dokunma veya arka planda eşzamanlı senkron) `_host.items`/cache üzerinde
  /// birbirini ezmesini engellemek için tüm ekleme işlemleri bu kilitten
  /// SIRAYLA geçer — bir önceki `add()` tamamlanmadan bir sonraki başlamaz.
  Future<void> _addLock = Future<void>.value();

  Future<T> _serializeAdd<T>(Future<T> Function() action) {
    final completer = Completer<T>();
    _addLock = _addLock.then((_) async {
      try {
        completer.complete(await action());
      } catch (e, st) {
        completer.completeError(e, st);
      }
    });
    return completer.future;
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
  }) =>
      _serializeAdd(() => _addInternal(Subscription(
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
          )));

  Future<Subscription> _createRemote(Subscription draft) => _repo.create(
        userId: _userId,
        name: draft.name,
        amount: draft.amount,
        currency: draft.currency,
        billingCycle: draft.billingCycle,
        startDate: draft.startDate,
        nextRenewalDate: draft.nextRenewalDate,
        category: draft.category,
        notes: draft.notes,
        paymentMethod: draft.paymentMethod,
        trialEndDate: draft.trialEndDate,
        trialPriceAfter: draft.trialPriceAfter,
      );

  /// [draft] yerel (`local-...`) kimlikli taslaktır: sunucu kaydı başarılı olursa
  /// gerçek kayıtla, bağlantı yoksa iyimser olarak kendisiyle eklenir.
  Future<bool> _addInternal(Subscription draft) async {
    _host.setLoading(true);
    try {
      var sub = await _createRemote(draft);
      final rules = draft.notificationRules;
      if (rules.any((r) => r.daysBefore != 3 || !r.enabled)) {
        sub = await _repo.update(sub.copyWith(notificationRules: rules));
      }
      _host.items.add(sub);
      _host.error = null;
      await _cache.write(_host.items);
      _host.notify();
      return true;
    } on NetworkException {
      // Test 48: bağlantı yokken de abonelik eklenebilmeli. Geçici bir
      // local id ile İYİMSER (optimistic) olarak listeye ekliyoruz; bağlantı
      // gelince OfflineSyncCoordinator bunu gerçek sunucu kaydıyla değiştirecek.
      _host.items.add(draft);
      await _sync.enqueue('create', draft.toJson());
      _host.error = null;
      await _cache.write(_host.items);
      _host.notify();
      return true;
    } catch (e) {
      _host.error = userMessageFor(e);
      _host.notify();
      return false;
    } finally {
      _host.setLoading(false);
    }
  }

  Future<bool> edit(Subscription updated) async {
    _host.setLoading(true);
    try {
      final result = await _repo.update(updated);
      final idx = _host.items.indexWhere((s) => s.id == result.id);
      if (idx != -1) _host.items[idx] = result;
      _host.error = null;
      await _cache.write(_host.items);
      _host.notify();
      return true;
    } on NetworkException {
      // Test 48: bağlantı yokken de düzenleme kaybolmamalı — değişikliği
      // yerel olarak uyguluyor, sunucuya yazımı bağlantı gelince
      // OfflineSyncCoordinator'a bırakıyoruz.
      final idx = _host.items.indexWhere((s) => s.id == updated.id);
      if (idx != -1) _host.items[idx] = updated;
      await _sync.enqueue('update', updated.toJson());
      _host.error = null;
      await _cache.write(_host.items);
      _host.notify();
      return true;
    } catch (e) {
      _host.error = userMessageFor(e);
      _host.notify();
      return false;
    } finally {
      _host.setLoading(false);
    }
  }

  /// Aboneliği kalıcı olarak siler (Test 18–21, 40). Sonraki listelemede
  /// görünmez ve bekleyen bildirimleri iptal edilir.
  Future<void> delete(String subscriptionId) async {
    try {
      await _repo.delete(_userId, subscriptionId);
    } on NetworkException {
      await _sync.enqueue('delete', {'id': subscriptionId});
    } catch (e) {
      _host.error = userMessageFor(e);
      _host.notify();
      rethrow;
    }
    await _notifications.cancelForSubscription(subscriptionId);
    _host.items.removeWhere((s) => s.id == subscriptionId);
    await _cache.write(_host.items);
    _host.notify();
  }
}
