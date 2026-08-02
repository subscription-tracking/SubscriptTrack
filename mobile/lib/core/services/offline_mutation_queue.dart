import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Pending mutation that could not be sent while offline.
class OfflineMutation {
  const OfflineMutation({
    required this.type,
    required this.payload,
    required this.enqueuedAt,
  });

  /// Operation type — mirrors SubscriptionDataSource method names.
  final String type; // create | update | delete | pause | resume | cancel | archive | restore

  final Map<String, dynamic> payload;
  final DateTime enqueuedAt;

  Map<String, dynamic> toJson() => {
        'type': type,
        'payload': payload,
        'enqueuedAt': enqueuedAt.toIso8601String(),
      };

  factory OfflineMutation.fromJson(Map<String, dynamic> j) =>
      OfflineMutation(
        type: j['type'] as String,
        payload: (j['payload'] as Map<String, dynamic>),
        enqueuedAt: DateTime.parse(j['enqueuedAt'] as String),
      );
}

/// Persists offline mutations in SharedPreferences and replays them on reconnect.
///
/// Usage:
///   await queue.enqueue(OfflineMutation(type: 'pause', payload: {'id': sub.id}, enqueuedAt: DateTime.now()));
///   // On reconnect:
///   final pending = await queue.drain();
///   for (final m in pending) { await _apply(m); }
class OfflineMutationQueue {
  static const _key = 'offline_mutation_queue';
  Future<void> _tail = Future<void>.value();

  Future<T> _synchronized<T>(Future<T> Function() operation) {
    final result = _tail.then((_) => operation());
    _tail = result.then<void>((_) {}, onError: (_) {});
    return result;
  }

  Future<List<OfflineMutation>> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
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
    final prefs = await SharedPreferences.getInstance();
    if (queue.isEmpty) {
      await prefs.remove(_key);
    } else {
      await prefs.setString(_key, jsonEncode(queue.map((m) => m.toJson()).toList()));
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

  Future<bool> get isEmpty => _synchronized(() async => (await _load()).isEmpty);

  Future<int> get length => _synchronized(() async => (await _load()).length);

  Future<void> clear() => _synchronized(() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  });
}
