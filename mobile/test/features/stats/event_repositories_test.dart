import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/savings/data/savings_repository.dart';
import 'package:subscript_track/features/stats/data/payment_events_repository.dart';

import '../../support/mock_supabase.dart';

typedef _Handler = http.Response Function(RecordedRequest request);

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('PaymentEventsRepository — yerel mod', () {
    final repo = PaymentEventsRepository();

    test('kayıt eklenir, en yeni başta listelenir ve UTC saklanır', () async {
      final first = await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        amount: Money.parse('10.50'),
        currency: 'TRY',
        paidAt: DateTime(2026, 9, 1, 12),
      );
      final second = await repo.record(
        userId: 'u1',
        subscriptionId: 's2',
        amount: Money.parse('20'),
        currency: 'USD',
        paidAt: DateTime(2026, 9, 2, 12),
      );

      expect(first.id, isNot(second.id));
      expect(first.paidAt.isUtc, isTrue);
      final all = await repo.fetch('u1');
      expect(all.map((e) => e.id), [second.id, first.id]);
      expect(all.last.amount, Money.parse('10.50'));
    });

    test('kullanıcılar birbirinin kaydını görmez', () async {
      await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        amount: Money.parse('1'),
        currency: 'TRY',
        paidAt: DateTime(2026, 9, 1),
      );
      expect(await repo.fetch('u2'), isEmpty);
    });

    test('güncelleme ve silme', () async {
      final e = await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        amount: Money.parse('10'),
        currency: 'TRY',
        paidAt: DateTime(2026, 9, 1),
      );
      final changed = PaymentEvent(
        id: e.id,
        subscriptionId: e.subscriptionId,
        amount: Money.parse('99'),
        currency: 'TRY',
        paidAt: e.paidAt,
      );
      expect(await repo.update(userId: 'u1', event: changed), changed);
      expect((await repo.fetch('u1')).single.amount, Money.parse('99'));

      await repo.delete(userId: 'u1', id: e.id);
      expect(await repo.fetch('u1'), isEmpty);
    });
  });

  group('PaymentEventsRepository — Supabase modu', () {
    late MockSupabase supabase;
    late _Handler handler;
    late PaymentEventsRepository repo;

    setUp(() {
      handler = (r) => MockSupabase.ok([]);
      supabase = MockSupabase((r) => handler(r));
      repo = PaymentEventsRepository(client: supabase.client);
    });
    tearDown(() => supabase.dispose());

    Map<String, dynamic> row(String id,
            {Map<String, dynamic> extra = const {}}) =>
        {
          'id': id,
          'subscription_id': 's1',
          'amount': '12.34',
          'currency': 'EUR',
          'paid_at': '2026-09-01T09:00:00Z',
          ...extra,
        };

    test('fetch: kullanıcı filtresi ve alan eşlemesi', () async {
      handler = (r) => MockSupabase.ok([row('e1'), row('e2')]);
      final events = await repo.fetch('u1');

      final request = supabase.requests.single;
      expect(request.path, '/rest/v1/payment_events');
      expect(request.query['user_id'], 'eq.u1');
      expect(request.query['order'], startsWith('paid_at.desc'));
      expect(events.map((e) => e.id), ['e1', 'e2']);
      expect(events.first.amount, Money.parse('12.34'));
      expect(events.first.currency, 'EUR');
      expect(events.first.paidAt, DateTime.utc(2026, 9, 1, 9));
    });

    test('record: idempotent RPC parametreleri ve dönen satır', () async {
      handler = (r) => MockSupabase.ok(row('yeni'));
      final event = await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        amount: Money.parse('12.34'),
        currency: 'EUR',
        paidAt: DateTime.utc(2026, 9, 1, 9),
      );

      final request = supabase.requests.single;
      expect(request.path, '/rest/v1/rpc/record_payment_idempotent');
      expect(request.json['p_subscription_id'], 's1');
      expect(request.json['p_amount'], '12.34');
      expect(request.json['p_paid_at'], '2026-09-01T09:00:00.000Z');
      expect(request.json['p_idempotency_key'], isNotEmpty);
      expect(event.id, 'yeni');
    });

    test('update: yalnızca kullanıcının satırını günceller', () async {
      handler = (r) => MockSupabase.ok(row('e1', extra: {'amount': '50.00'}));
      final updated = await repo.update(
        userId: 'u1',
        event: PaymentEvent(
          id: 'e1',
          subscriptionId: 's1',
          amount: Money.parse('50'),
          currency: 'EUR',
          paidAt: DateTime.utc(2026, 9, 1),
        ),
      );
      final request = supabase.requests.single;
      expect(request.method, 'PATCH');
      expect(request.query['id'], 'eq.e1');
      expect(request.query['user_id'], 'eq.u1');
      expect(request.json['amount'], '50.00');
      expect(updated.amount, Money.parse('50'));
    });

    test('delete: kimlik ve kullanıcı filtresi', () async {
      handler = (r) => MockSupabase.ok(null, status: 204);
      await repo.delete(userId: 'u1', id: 'e1');
      final request = supabase.requests.single;
      expect(request.method, 'DELETE');
      expect(request.query['id'], 'eq.e1');
      expect(request.query['user_id'], 'eq.u1');
    });

    test('tüm işlemlerde sunucu hatası NetworkException olur', () async {
      handler = (r) => MockSupabase.error('boom', status: 500);
      final event = PaymentEvent(
        id: 'e1',
        subscriptionId: 's1',
        amount: Money.parse('1'),
        currency: 'TRY',
        paidAt: DateTime.utc(2026),
      );
      await expectLater(repo.fetch('u1'), throwsA(isA<NetworkException>()));
      await expectLater(
        repo.record(
          userId: 'u1',
          subscriptionId: 's1',
          amount: Money.parse('1'),
          currency: 'TRY',
          paidAt: DateTime.utc(2026),
        ),
        throwsA(isA<NetworkException>()),
      );
      await expectLater(repo.update(userId: 'u1', event: event),
          throwsA(isA<NetworkException>()));
      await expectLater(repo.delete(userId: 'u1', id: 'e1'),
          throwsA(isA<NetworkException>()));
    });
  });

  group('SavingsRepository — yerel mod', () {
    final repo = SavingsRepository();

    test('olaylar en yeni başta saklanır', () async {
      await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        eventType: 'CANCELLED',
        monthlyAmount: Money.parse('10'),
        annualAmount: Money.parse('120'),
        currency: 'TRY',
      );
      await repo.record(
        userId: 'u1',
        subscriptionId: 's2',
        eventType: 'PAUSED',
        monthlyAmount: Money.parse('5'),
        annualAmount: Money.parse('60'),
        currency: 'USD',
      );

      final events = await repo.fetch('u1');
      expect(events.map((e) => e.eventType), ['PAUSED', 'CANCELLED']);
      expect(events.first.annualAmount, Money.parse('60'));
      expect(events.first.effectiveAt.isUtc, isTrue);
      expect(await repo.fetch('baska'), isEmpty);
    });
  });

  group('SavingsRepository — Supabase modu', () {
    late MockSupabase supabase;
    late _Handler handler;
    late SavingsRepository repo;

    setUp(() {
      handler = (r) => MockSupabase.ok([]);
      supabase = MockSupabase((r) => handler(r));
      repo = SavingsRepository(client: supabase.client);
    });
    tearDown(() => supabase.dispose());

    test('record: satırı kullanıcı ve abonelikle ekler', () async {
      handler = (r) => MockSupabase.ok(null, status: 201);
      await repo.record(
        userId: 'u1',
        subscriptionId: 's1',
        eventType: 'CANCELLED',
        monthlyAmount: Money.parse('10'),
        annualAmount: Money.parse('120'),
        currency: 'TRY',
      );
      final request = supabase.requests.single;
      expect(request.method, 'POST');
      expect(request.path, '/rest/v1/savings_events');
      expect(request.json['user_id'], 'u1');
      expect(request.json['event_type'], 'CANCELLED');
      expect(request.json['annual_amount'], '120.00');
    });

    test('fetch: eşleme, varsayılanlar ve sıralama', () async {
      handler = (r) => MockSupabase.ok([
            {
              'event_type': 'PAUSED',
              'monthly_amount': '5.00',
              'annual_amount': '60.00',
              'currency': 'USD',
              'effective_at': '2026-09-01T00:00:00Z',
            },
            {
              'monthly_amount': '10.00',
              'annual_amount': '120.00',
            },
          ]);
      final events = await repo.fetch('u1');

      final request = supabase.requests.single;
      expect(request.query['user_id'], 'eq.u1');
      expect(request.query['order'], startsWith('effective_at.desc'));
      expect(request.query['limit'], '100');
      expect(events.first.eventType, 'PAUSED');
      expect(events.first.effectiveAt, DateTime.utc(2026, 9));
      // Eksik alanlar varsayılana düşer.
      expect(events.last.eventType, 'CANCELLED');
      expect(events.last.currency, 'TRY');
    });

    test('hatalar NetworkException olur', () async {
      handler = (r) => MockSupabase.error('boom', status: 500);
      await expectLater(repo.fetch('u1'), throwsA(isA<NetworkException>()));
      await expectLater(
        repo.record(
          userId: 'u1',
          subscriptionId: 's1',
          eventType: 'CANCELLED',
          monthlyAmount: Money.parse('1'),
          annualAmount: Money.parse('12'),
          currency: 'TRY',
        ),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}
