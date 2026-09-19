import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Pending mutation that could not be sent while offline.
class OfflineMutation {
  const OfflineMutation({
    required this.type,
    required this.payload,
    required this.enqueuedAt,
  });

  /// Operation type — mirrors SubscriptionDataSource method names.
  final String
      type; // create | update | delete | pause | resume | cancel | archive | restore

  final Map<String, dynamic> payload;
  final DateTime enqueuedAt;

  Map<String, dynamic> toJson() => {
        'type': type,
        'payload': payload,
        'enqueuedAt': enqueuedAt.toIso8601String(),
      };

  factory OfflineMutation.fromJson(Map<String, dynamic> j) => OfflineMutation(
        type: j['type'] as String,
        payload: (j['payload'] as Map<String, dynamic>),
        enqueuedAt: DateTime.parse(j['enqueuedAt'] as String),
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
class OfflineMutationQueue {
  static const _legacyKey = 'offline_mutation_queue';
  static const _secureKey = 'offline_mutation_queue_v2';
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  Future<void> _tail = Future<void>.value();

  Future<T> _synchronized<T>(Future<T> Function() operation) {
    final result = _tail.then((_) => operation());
    _tail = result.then<void>((_) {}, onError: (_) {});
    return result;
  }

  Future<List<OfflineMutation>> _load() async {
    var raw = await _storage.read(key: _secureKey);
    if (raw == null) {
      final prefs = await SharedPreferences.getInstance();
      final legacy = prefs.getString(_legacyKey);
      if (legacy != null) {
        await _storage.write(key: _secureKey, value: legacy);
        await prefs.remove(_legacyKey);
        raw = legacy;
      }
    }
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => OfflineMutation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
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
        current.add(mutation);
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

  Future<void> clear() => _synchronized(() async {
        final prefs = await SharedPreferences.getInstance();
        await _storage.delete(key: _secureKey);
        await prefs.remove(_legacyKey);
      });
}
