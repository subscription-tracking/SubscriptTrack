import 'dart:async';

import '../../../core/datasources/subscription_data_source.dart';
import '../domain/subscription_models.dart';
import 'supabase_subscription_repository.dart';

/// Test 54: repo Supabase destekliyorsa kullanıcının abonelik satırlarını
/// Realtime üzerinden dinler — başka bir cihazdaki değişiklikler manuel
/// yenileme gerekmeden kısa sürede yansır. `LocalSubscriptionRepository`
/// (çevrimdışı mod) veya test fake'leri bunu desteklemez; [tryStart] `null`
/// döner.
class SubscriptionRealtimeSync {
  SubscriptionRealtimeSync._(this._subscription);

  final StreamSubscription<List<Subscription>> _subscription;

  static SubscriptionRealtimeSync? tryStart(
    SubscriptionDataSource repository,
    String userId,
    void Function(List<Subscription> serverItems) onData,
  ) {
    if (repository is! SupabaseSubscriptionRepository) return null;
    return SubscriptionRealtimeSync._(
      repository.watchAll(userId).listen(
            onData,
            // Bağlantı kopması sessizce yutulur; manuel load() yedek kalır.
            onError: (_) {},
          ),
    );
  }

  /// Sunucudan gelen taze listeyi [current] ile birleştirir. Henüz sunucuya
  /// senkronize OLMAMIŞ yerel-öncelikli kayıtları (çevrimdışı eklenmiş,
  /// "local-" id'li) KORUR; sunucu listesi onları içermediği için
  /// kaybolmalarını önler.
  static List<Subscription> merge(
    List<Subscription> current,
    List<Subscription> serverItems,
  ) =>
      [
        ...serverItems,
        ...current.where((s) => s.id.startsWith('local-')),
      ];

  Future<void> cancel() => _subscription.cancel();
}
