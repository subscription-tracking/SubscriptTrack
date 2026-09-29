import 'dart:convert';

import '../../../core/errors/error_messages.dart';
import '../../../core/storage/local_storage.dart';
import '../domain/subscription_models.dart';

/// Kullanıcıya özel abonelik listesinin cihaz üzerindeki çevrimdışı önbelleği.
/// Okuma/yazma hataları önbelleğin isteğe bağlı doğası gereği yutulur.
class SubscriptionCache {
  SubscriptionCache(String userId, {LocalStorage? storage})
      : _key = 'cache_$userId',
        _storage = storage ?? LocalStorage.instance;

  final String _key;
  final LocalStorage _storage;

  Future<void> write(List<Subscription> items) async {
    try {
      final json = jsonEncode(items.map((s) => s.toJson()).toList());
      await _storage.writeSubscriptions(_key, json);
    } catch (e) {
      // Önbellek yazılamazsa uygulama çalışmaya devam eder.
      logIgnoredError('SubscriptionCache.write', e);
    }
  }

  Future<List<Subscription>?> read() async {
    try {
      final raw = await _storage.readSubscriptions(_key);
      if (raw == null) return null;
      return (jsonDecode(raw) as List<dynamic>)
          .map((e) => Subscription.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      logIgnoredError('SubscriptionCache.read', e);
      return null;
    }
  }
}
