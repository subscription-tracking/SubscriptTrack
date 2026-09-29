import '../../../core/errors/error_messages.dart';
import '../../../core/datasources/subscription_data_source.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../domain/subscription_models.dart';

/// Çevrimdışıyken biriken mutasyonları kuyruğa alır ve bağlantı gelince
/// sunucuya sırayla uygular.
///
/// [items], controller'ın o anki abonelik listesini döndürmelidir; uygulanan
/// mutasyonlar bu liste üzerinde yerinde (in-place) değişiklik yapar.
class OfflineSyncCoordinator {
  OfflineSyncCoordinator({
    required SubscriptionDataSource repository,
    required OfflineMutationQueue queue,
    required String userId,
    required List<Subscription> Function() items,
  })  : _repo = repository,
        _queue = queue,
        _userId = userId,
        _items = items;

  final SubscriptionDataSource _repo;
  final OfflineMutationQueue _queue;
  final String _userId;
  final List<Subscription> Function() _items;

  Future<int> get pendingCount => _queue.length;

  Future<void> enqueue(String type, Map<String, dynamic> payload) =>
      _queue.enqueue(OfflineMutation(
        type: type,
        payload: payload,
        enqueuedAt: DateTime.now().toUtc(),
      ));

  /// Kuyruğu ilk hataya kadar sırayla oynatır. En az bir mutasyon uygulandıysa
  /// `true` döner.
  Future<bool> replay() async {
    var replayedAny = false;
    while (true) {
      final mutation = await _queue.peek();
      if (mutation == null) break;
      try {
        await apply(mutation);
        await _queue.removeFirst();
        replayedAny = true;
      } catch (e) {
        // İlk hatada durulur; mutasyon kuyruğun başında kalır ve sonraki
        // senkronda yeniden denenir.
        logIgnoredError('OfflineSyncCoordinator.replay(${mutation.type})', e);
        break;
      }
    }
    return replayedAny;
  }

  Future<void> apply(OfflineMutation mutation) async {
    final id = mutation.payload['id'] as String?;
    if (id == null) {
      throw StateError('Offline mutation has no subscription id.');
    }
    switch (mutation.type) {
      case 'pause' || 'resume' || 'cancel' || 'archive' || 'restore':
        await _applyTransition(mutation.type, id);
      case 'delete':
        await _repo.delete(_userId, id);
        _items().removeWhere((s) => s.id == id);
      case 'create':
        await _applyCreate(id, Subscription.fromJson(mutation.payload));
      case 'update':
        final result = await _repo.update(
          Subscription.fromJson(mutation.payload),
        );
        final items = _items();
        final index = items.indexWhere((s) => s.id == result.id);
        if (index != -1) items[index] = result;
      default:
        throw StateError('Unsupported offline mutation: ${mutation.type}');
    }
  }

  /// Yaşam döngüsü geçişini sunucuya gönderir, ardından yerel durumu günceller.
  Future<void> _applyTransition(String type, String id) async {
    final SubscriptionStatus status;
    switch (type) {
      case 'pause':
        await _repo.pause(_userId, id);
        status = SubscriptionStatus.paused;
      case 'resume':
        await _repo.resume(_userId, id);
        status = SubscriptionStatus.active;
      case 'cancel':
        await _repo.cancel(_userId, id);
        status = SubscriptionStatus.cancelled;
      case 'archive':
        await _repo.archive(_userId, id);
        status = SubscriptionStatus.archived;
      default:
        await _repo.restore(_userId, id);
        status = SubscriptionStatus.active;
    }
    _setStatus(id, status);
  }

  /// Payload, çevrimdışıyken oluşturulan geçici (`local-...`) id'li
  /// aboneliktir. Sunucu gerçek id'yi atayınca yerel yer tutucu gerçek kayıtla
  /// DEĞİŞTİRİLİR (id değişir) ve kuyruktaki sonraki mutasyonların id'leri
  /// güncellenir.
  Future<void> _applyCreate(String id, Subscription local) async {
    final created = await _repo.create(
      userId: _userId,
      name: local.name,
      amount: local.amount,
      currency: local.currency,
      billingCycle: local.billingCycle,
      startDate: local.startDate,
      nextRenewalDate: local.nextRenewalDate,
      category: local.category,
      notes: local.notes,
      paymentMethod: local.paymentMethod,
      trialEndDate: local.trialEndDate,
      trialPriceAfter: local.trialPriceAfter,
    );
    // Yeniden senkronda `getAll` bu kaydı henüz döndürmemiş olabilir; yerel
    // geçici öğe varsa yerine koy, yoksa (silinmişse) ekle.
    final items = _items();
    final index = items.indexWhere((s) => s.id == id);
    if (index != -1) {
      items[index] = created;
    } else {
      items.add(created);
    }
    await _queue.replaceSubscriptionId(local.id, created.id);
  }

  void _setStatus(String id, SubscriptionStatus status) {
    final items = _items();
    final index = items.indexWhere((s) => s.id == id);
    if (index != -1) items[index] = items[index].copyWith(status: status);
  }
}
