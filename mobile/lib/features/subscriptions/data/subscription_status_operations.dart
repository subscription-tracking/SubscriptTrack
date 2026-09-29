import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_messages.dart';
import '../../../core/services/notification_scheduler.dart';
import '../domain/subscription_models.dart';
import 'offline_sync_coordinator.dart';
import 'payment_history_store.dart';
import 'subscription_cache.dart';
import 'subscription_operations.dart';

/// Toplu silme/arşivleme ve yaşam döngüsü durum geçişleri (arşivle, geri al,
/// duraklat, sürdür, iptal et). Bağlantı yokken işlem kuyruğa alınır.
class SubscriptionStatusOperations {
  SubscriptionStatusOperations({
    required SubscriptionHost host,
    required SubscriptionDataSource repository,
    required OfflineSyncCoordinator sync,
    required SubscriptionCache cache,
    required PaymentHistoryStore history,
    required NotificationScheduler notifications,
    required String userId,
    required this.findById,
  })  : _host = host,
        _repo = repository,
        _sync = sync,
        _cache = cache,
        _history = history,
        _notifications = notifications,
        _userId = userId;

  final SubscriptionHost _host;
  final SubscriptionDataSource _repo;
  final OfflineSyncCoordinator _sync;
  final SubscriptionCache _cache;
  final PaymentHistoryStore _history;
  final NotificationScheduler _notifications;
  final String _userId;
  final Subscription? Function(String id) findById;

  void _updateLocalStatus(String id, SubscriptionStatus status) {
    final items = _host.items;
    final idx = items.indexWhere((s) => s.id == id);
    if (idx != -1) items[idx] = items[idx].copyWith(status: status);
  }

  /// Toplu silme (Test 21). Tek [delete] çağrısını her id için tekrarlamak
  /// yerine ayrı bir metod: tüm silmeler bitene kadar tek bir
  /// `_host.notify()`/cache yazımı yapılır ("tek seferde silinir"), ve bir
  /// id başarısız olsa bile diğerlerinin silinmesi durdurulmaz — hepsi
  /// denenir, başarısız olanlar [error] üzerinden özetlenir.
  Future<void> deleteMany(List<String> subscriptionIds) async {
    final failed = <String>[];
    for (final id in subscriptionIds) {
      try {
        await _repo.delete(_userId, id);
        _host.items.removeWhere((s) => s.id == id);
        await _notifications.cancelForSubscription(id);
      } on NetworkException {
        await _sync.enqueue('delete', {'id': id});
        _host.items.removeWhere((s) => s.id == id);
        await _notifications.cancelForSubscription(id);
      } catch (e) {
        logIgnoredError('SubscriptionController.deleteMany', e);
        failed.add(id);
      }
    }
    _host.error = failed.isEmpty
        ? null
        : '${failed.length} abonelik silinemedi, tekrar dene.';
    await _cache.write(_host.items);
    _host.notify();
  }

  /// Toplu işlemde normal yaşam döngüsüne uygun seçenek fiziksel silme değil,
  /// arşivlemedir. Arşivlenen kayıtlar geçmişte kalır ve bildirimleri iptal
  /// edilir.
  Future<void> archiveMany(List<String> subscriptionIds) async {
    final failed = <String>[];
    for (final id in subscriptionIds) {
      final current = findById(id);
      if (current == null ||
          !current.status.canTransitionTo(SubscriptionStatus.archived)) {
        failed.add(id);
        continue;
      }
      try {
        await _repo.archive(_userId, id);
      } on NetworkException {
        await _sync.enqueue('archive', {'id': id});
      } catch (e) {
        logIgnoredError('SubscriptionController.archiveMany', e);
        failed.add(id);
        continue;
      }
      _updateLocalStatus(id, SubscriptionStatus.archived);
      await _notifications.cancelForSubscription(id);
    }
    _host.error = failed.isEmpty
        ? null
        : '${failed.length} abonelik arşivlenemedi, tekrar dene.';
    await _cache.write(_host.items);
    _host.notify();
  }

  Future<void> archive(String id) => _updateStatus(
      id, SubscriptionStatus.archived, () => _repo.archive(_userId, id),
      mutationType: 'archive');

  Future<void> restore(String id) => _updateStatus(
      id, SubscriptionStatus.active, () => _repo.restore(_userId, id),
      mutationType: 'restore');

  Future<void> pause(String id) {
    final sub = findById(id);
    return _updateStatus(
      id,
      SubscriptionStatus.paused,
      () => _repo.pause(_userId, id),
      mutationType: 'pause',
      onSuccess: sub == null
          ? null
          : () => _history.recordSavings(
                subscriptionId: id,
                eventType: 'PAUSED',
                monthlyAmount: sub.monthlyAmount,
                currency: sub.currency,
              ),
    );
  }

  Future<void> resume(String id) => _updateStatus(
      id, SubscriptionStatus.active, () => _repo.resume(_userId, id),
      mutationType: 'resume');

  Future<void> cancel(String id) {
    final sub = findById(id);
    return _updateStatus(
      id,
      SubscriptionStatus.cancelled,
      () => _repo.cancel(_userId, id),
      mutationType: 'cancel',
      onSuccess: sub == null
          ? null
          : () => _history.recordSavings(
                subscriptionId: id,
                eventType: 'CANCELLED',
                monthlyAmount: sub.monthlyAmount,
                currency: sub.currency,
              ),
    );
  }

  Future<void> _updateStatus(
    String id,
    SubscriptionStatus status,
    Future<void> Function() repoCall, {
    required String mutationType,
    Future<void> Function()? onSuccess,
  }) async {
    final idx = _host.items.indexWhere((s) => s.id == id);
    if (idx != -1 && !_host.items[idx].status.canTransitionTo(status)) {
      throw ValidationException(
          'status_transition_unsupported:${_host.items[idx].status.key}:${status.key}');
    }
    var succeeded = false;
    try {
      await repoCall();
      succeeded = true;
    } on NetworkException {
      await _sync.enqueue(mutationType, {'id': id});
    }
    // Record side-effects only when the server call succeeded (not queued offline).
    if (succeeded && onSuccess != null) await onSuccess();
    if (idx != -1) _host.items[idx] = _host.items[idx].copyWith(status: status);
    await _cache.write(_host.items);
    _host.notify();
  }
}
