import 'dart:convert';

import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../errors/error_messages.dart';

/// Pending mutation that could not be sent while offline.
class OfflineMutation {
  const OfflineMutation({
    required this.type,
    required this.payload,
    required this.enqueuedAt,
    this.userId,
  });

  /// Operation type — mirrors SubscriptionDataSource method names.
  final String
      type; // create | update | delete | pause | resume | cancel | archive | restore

  final Map<String, dynamic> payload;
  final DateTime enqueuedAt;

  /// Mutasyonu kuyruğa alan kullanıcı. Kuyruk zaten kullanıcıya özel anahtarda
  /// tutulur; bu alan, anahtar karışırsa başka kullanıcıya ait girdinin
  /// yanlışlıkla oynatılmasını önleyen ikinci savunmadır.
  final String? userId;

  OfflineMutation withUser(String userId) => OfflineMutation(
        type: type,
        payload: payload,
        enqueuedAt: enqueuedAt,
        userId: userId,
      );

  Map<String, dynamic> toJson() => {
        'type': type,
        'payload': payload,
        'enqueuedAt': enqueuedAt.toIso8601String(),
        if (userId != null) 'userId': userId,
      };

  factory OfflineMutation.fromJson(Map<String, dynamic> j) => OfflineMutation(
        type: j['type'] as String,
        payload: (j['payload'] as Map<String, dynamic>),
        enqueuedAt: DateTime.parse(j['enqueuedAt'] as String),
        userId: j['userId'] as String?,
      );
}

/// Persists offline mutations in encrypted device storage and replays them on
/// reconnect. The legacy SharedPreferences value is migrated on first read.
///
/// Usage:
///   await queue.enqueue(OfflineMutation(type: 'pause', payload: {'id': sub.id}, enqueuedAt: DateTime.now()));
///   // On reconnect:
///   final pending = await queue.drain();
///   for (final m in pending) { await _apply(m); }
///
/// Kuyruk **kullanıcıya özeldir** (`offline_mutation_queue_v3:<userId>`): bir
/// kullanıcının çevrimdışı eklediği kayıt, aynı cihazda sonradan giriş yapan
/// başka bir kullanıcının hesabına asla yazılmaz. Önceki sürümlerdeki tek
/// global kuyruk sahibi bilinemediği için **atılır** (yalnızca geliştirme
/// cihazlarında vardı; sızıntı riski veri kaybından ağırdır).
class OfflineMutationQueue {
  OfflineMutationQueue({required String userId}) : _userId = userId {
    if (userId.trim().isEmpty) {
      throw ArgumentError.value(
          userId, 'userId', 'Kullanıcı kimliği boş olamaz.');
    }
  }

  static const _keyPrefix = 'offline_mutation_queue_v3:';
  // Eski, kullanıcıya özel olmayan anahtarlar (atılır).
  static const _legacyKey = 'offline_mutation_queue';
  static const _legacyGlobalSecureKey = 'offline_mutation_queue_v2';
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
  );
  static bool _legacyDiscarded = false;

  /// Testlerde eski-kuyruk silme adımını yeniden çalıştırmak için.
  @visibleForTesting
  static void debugResetLegacyDiscard() => _legacyDiscarded = false;

  final String _userId;
  String get _secureKey => '$_keyPrefix$_userId';
  Future<void> _tail = Future<void>.value();

  /// Sahibi bilinmeyen eski global kuyruğu bir kez siler.
  Future<void> _discardLegacy() async {
    if (_legacyDiscarded) return;
    _legacyDiscarded = true;
    try {
      final old = await _storage.read(key: _legacyGlobalSecureKey);
      final prefs = await SharedPreferences.getInstance();
      final hadLegacy = old != null || prefs.getString(_legacyKey) != null;
      await _storage.delete(key: _legacyGlobalSecureKey);
      await prefs.remove(_legacyKey);
      if (hadLegacy) {
        logIgnoredError('OfflineMutationQueue.legacy',
            'Sahibi bilinmeyen eski global çevrimdışı kuyruk silindi.');
      }
    } catch (e) {
      logIgnoredError('OfflineMutationQueue.discardLegacy', e);
    }
  }

  Future<T> _synchronized<T>(Future<T> Function() operation) {
    final result = _tail.then((_) => operation());
    _tail = result.then<void>((_) {}, onError: (_) {});
    return result;
  }

  Future<List<OfflineMutation>> _load() async {
    await _discardLegacy();
    final raw = await _storage.read(key: _secureKey);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => OfflineMutation.fromJson(e as Map<String, dynamic>))
          // İkinci savunma: başka kullanıcıya damgalı girdi asla oynatılmaz.
          .where((m) => m.userId == null || m.userId == _userId)
          .toList();
    } catch (e) {
      logIgnoredError('OfflineMutationQueue.load', e);
      return [];
    }
  }

  Future<void> _save(List<OfflineMutation> queue) async {
    if (queue.isEmpty) {
      await _storage.delete(key: _secureKey);
    } else {
      await _storage.write(
        key: _secureKey,
        value: jsonEncode(queue.map((m) => m.toJson()).toList()),
      );
    }
  }

  Future<void> enqueue(OfflineMutation mutation) => _synchronized(() async {
        final current = await _load();
        current.add(mutation.withUser(_userId));
        await _save(current);
      });

  /// Reads the next mutation without removing it.
  ///
  /// Replay consumers must only call [removeFirst] after the remote operation
  /// succeeds; this keeps FIFO order intact when the network drops mid-replay.
  Future<OfflineMutation?> peek() => _synchronized(() async {
        final current = await _load();
        return current.isEmpty ? null : current.first;
      });

  /// Removes the current head after a successful replay.
  Future<void> removeFirst() => _synchronized(() async {
        final current = await _load();
        if (current.isEmpty) return;
        current.removeAt(0);
        await _save(current);
      });

  /// Bir offline create işlemi sunucuda gerçek kimlik aldığında, onu izleyen
  /// mutasyonların geçici `local-...` kimliğini günceller. Böylece
  /// create → update/delete/status zinciri aynı sunucu kaydına uygulanır.
  Future<void> replaceSubscriptionId(String localId, String serverId) =>
      _synchronized(() async {
        if (localId == serverId) return;
        final current = await _load();
        final updated = current.map((mutation) {
          if (mutation.payload['id'] != localId) return mutation;
          return OfflineMutation(
            type: mutation.type,
            payload: {...mutation.payload, 'id': serverId},
            enqueuedAt: mutation.enqueuedAt,
            userId: mutation.userId,
          );
        }).toList();
        await _save(updated);
      });

  /// Returns all pending mutations and clears the queue atomically.
  ///
  /// Kept for maintenance flows. Normal network replay should use
  /// [peek]/[removeFirst] so a failed mutation is never moved behind newer ones.
  Future<List<OfflineMutation>> drain() => _synchronized(() async {
        final current = await _load();
        if (current.isEmpty) return [];
        await _save([]);
        return current;
      });

  Future<bool> get isEmpty =>
      _synchronized(() async => (await _load()).isEmpty);

  Future<int> get length => _synchronized(() async => (await _load()).length);

  /// Yalnızca bu kullanıcının kuyruğunu siler (hesap silme akışı).
  Future<void> clear() => _synchronized(() async {
        await _storage.delete(key: _secureKey);
      });
}
