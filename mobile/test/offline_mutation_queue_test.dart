import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/services/offline_mutation_queue.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('OfflineMutationQueue (S11)', () {
    test('başlangıçta boş olur', () async {
      final q = OfflineMutationQueue();
      expect(await q.isEmpty, isTrue);
      expect(await q.length, 0);
    });

    test('enqueue → length artar', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 'sub1'));
      expect(await q.length, 1);
    });

    test('birden fazla mutation eklenebilir', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 'sub1'));
      await q.enqueue(_m('archive', 'sub2'));
      await q.enqueue(_m('delete', 'sub3'));
      expect(await q.length, 3);
    });

    test('drain → tüm mutasyonları döner ve kuyruğu siler', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 'sub1'));
      await q.enqueue(_m('cancel', 'sub2'));

      final drained = await q.drain();

      expect(drained.length, 2);
      expect(drained[0].type, 'pause');
      expect(drained[1].type, 'cancel');
      expect(await q.isEmpty, isTrue);
    });

    test('drain boş kuyruk → boş liste döner', () async {
      final q = OfflineMutationQueue();
      final drained = await q.drain();
      expect(drained, isEmpty);
    });

    test('clear → kuyruk boşalır', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 's1'));
      await q.enqueue(_m('resume', 's2'));
      await q.clear();
      expect(await q.isEmpty, isTrue);
    });

    test('payload ve enqueuedAt korunur (JSON round-trip)', () async {
      final q = OfflineMutationQueue();
      final before = DateTime.utc(2026, 8, 1, 12, 0);
      await q.enqueue(OfflineMutation(
        type: 'archive',
        payload: {'id': 'abc-123'},
        enqueuedAt: before,
      ));

      // Yeni instance — aynı SharedPreferences'tan okur
      final q2 = OfflineMutationQueue();
      final drained = await q2.drain();
      expect(drained.first.type, 'archive');
      expect(drained.first.payload['id'], 'abc-123');
      expect(drained.first.enqueuedAt, before);
    });

    test('payload SharedPreferences içinde düz metin olarak saklanmaz',
        () async {
      final q = OfflineMutationQueue();
      await q.enqueue(OfflineMutation(
        type: 'create',
        payload: {'name': 'Gizli Abonelik', 'amount': '99.99'},
        enqueuedAt: DateTime.utc(2026, 8, 1),
      ));

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('offline_mutation_queue'), isNull);
    });

    test('legacy SharedPreferences kuyruğu güvenli depoya taşınır', () async {
      final legacy = jsonEncode([_m('pause', 'legacy-sub').toJson()]);
      SharedPreferences.setMockInitialValues(
          {'offline_mutation_queue': legacy});

      final q = OfflineMutationQueue();
      expect((await q.peek())!.payload['id'], 'legacy-sub');

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('offline_mutation_queue'), isNull);
    });

    test('sıra FIFO korunur', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 's1'));
      await q.enqueue(_m('resume', 's1'));
      await q.enqueue(_m('cancel', 's1'));
      final drained = await q.drain();
      expect(
          drained.map((m) => m.type).toList(), ['pause', 'resume', 'cancel']);
    });

    test('drain sonrası tekrar enqueue çalışır', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 's1'));
      await q.drain();
      await q.enqueue(_m('archive', 's2'));
      expect(await q.length, 1);
    });

    test('concurrent enqueue operations do not lose queued mutations',
        () async {
      final q = OfflineMutationQueue();
      await Future.wait([
        q.enqueue(_m('pause', 's1')),
        q.enqueue(_m('resume', 's1')),
        q.enqueue(_m('archive', 's2')),
      ]);
      expect(await q.length, 3);
    });

    test('peek and removeFirst preserve the replay FIFO head', () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('pause', 's1'));
      await q.enqueue(_m('cancel', 's1'));

      expect((await q.peek())!.type, 'pause');
      expect(await q.length, 2);

      await q.removeFirst();
      expect((await q.peek())!.type, 'cancel');
      expect(await q.length, 1);
    });

    test(
        'create sonraki işlemlerde geçici kimliği sunucu kimliğiyle değiştirir',
        () async {
      final q = OfflineMutationQueue();
      await q.enqueue(_m('create', 'local-123'));
      await q.enqueue(_m('update', 'local-123'));
      await q.enqueue(_m('delete', 'local-123'));

      await q.replaceSubscriptionId('local-123', 'server-456');
      final mutations = await q.drain();

      expect(
        mutations.map((m) => m.payload['id']).toList(),
        everyElement('server-456'),
      );
    });
  });
}

OfflineMutation _m(String type, String id) => OfflineMutation(
      type: type,
      payload: {'id': id},
      enqueuedAt: DateTime.utc(2026, 8, 1),
    );
