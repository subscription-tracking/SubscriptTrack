import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/data/supabase_subscription_repository.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

import '../../support/mock_supabase.dart';

Map<String, dynamic> _row({
  String id = 's1',
  Map<String, dynamic> extra = const {},
}) =>
    {
      'id': id,
      'user_id': 'u1',
      'name': 'Netflix',
      'amount': '99.90',
      'currency': 'TRY',
      'billing_cycle': 'monthly',
      'start_date': '2026-01-15',
      'next_renewal_date': '2026-10-15',
      'category': 'streaming',
      'status': 'active',
      'created_at': '2026-01-15T10:00:00Z',
      ...extra,
    };

typedef _Handler = http.Response Function(RecordedRequest request);

void main() {
  late MockSupabase supabase;
  late _Handler handler;
  late SupabaseSubscriptionRepository repo;

  setUp(() {
    handler = (r) => MockSupabase.ok([]);
    supabase = MockSupabase((r) => handler(r));
    repo = SupabaseSubscriptionRepository(client: supabase.client);
  });

  tearDown(() => supabase.dispose());

  group('getAll', () {
    test('kullanıcının abonelikleri yenileme tarihine göre istenir ve eşlenir',
        () async {
      handler = (r) => MockSupabase.ok([_row(), _row(id: 's2')]);
      final result = await repo.getAll('u1');

      final request = supabase.requests.single;
      expect(request.method, 'GET');
      expect(request.path, '/rest/v1/subscriptions');
      expect(request.query['user_id'], 'eq.u1');
      expect(request.query['order'], startsWith('next_renewal_date.asc'));
      expect(result.map((s) => s.id), ['s1', 's2']);
      final s = result.first;
      expect(s.name, 'Netflix');
      expect(s.amount, Money.parse('99.90'));
      expect(s.billingCycle, BillingCycle.monthly);
      expect(s.category, SubscriptionCategory.streaming);
      expect(s.status, SubscriptionStatus.active);
      expect(s.nextRenewalDate, DateTime.parse('2026-10-15'));
    });

    test('eksik alanlar güvenli varsayılanlara düşer', () async {
      handler = (r) => MockSupabase.ok([
            {
              'id': 's1',
              'user_id': 'u1',
              'name': 'Eski kayıt',
              'amount': 10,
            }
          ]);
      final s = (await repo.getAll('u1')).single;
      expect(s.currency, 'TRY');
      expect(s.billingCycle, BillingCycle.monthly);
      expect(s.category, SubscriptionCategory.other);
      expect(s.status, SubscriptionStatus.active);
      expect(s.notificationRules, const [NotificationRule(daysBefore: 3)]);
      expect(s.trialEndDate, isNull);
    });

    test('eski is_archived bayrağı arşiv durumuna çevrilir', () async {
      handler = (r) => MockSupabase.ok([
            _row(extra: {'status': null, 'is_archived': true})
          ]);
      expect(
          (await repo.getAll('u1')).single.status, SubscriptionStatus.archived);
    });

    test('deneme, hatırlatma kuralları ve not alanları eşlenir', () async {
      handler = (r) => MockSupabase.ok([
            _row(extra: {
              'status': 'trial',
              'trial_end_date': '2026-11-01',
              'trial_price_after': '49.90',
              'notes': 'aile paketi',
              'payment_method': 'Kredi Kartı',
              'notification_rules': [
                {'daysBefore': 1, 'enabled': true},
                {'daysBefore': 7, 'enabled': false},
              ],
            })
          ]);
      final s = (await repo.getAll('u1')).single;
      expect(s.status, SubscriptionStatus.trial);
      expect(s.trialEndDate, DateTime.parse('2026-11-01'));
      expect(s.trialPriceAfter, Money.parse('49.90'));
      expect(s.notes, 'aile paketi');
      expect(s.paymentMethod, 'Kredi Kartı');
      expect(s.notificationRules.map((r) => r.daysBefore), [1, 7]);
      expect(s.notificationRules.last.enabled, isFalse);
    });

    test('PostgREST hatası NetworkException olur', () async {
      handler = (r) => MockSupabase.error('permission denied', status: 403);
      await expectLater(
        repo.getAll('u1'),
        throwsA(isA<NetworkException>()
            .having((e) => e.message, 'message', 'permission denied')),
      );
    });
  });

  group('create', () {
    test('idempotent RPC çağrılır; ad kırpılır ve tarihler ISO gün olur',
        () async {
      handler = (r) => MockSupabase.ok(_row(id: 'yeni'));
      final created = await repo.create(
        userId: 'u1',
        name: '  Netflix ',
        amount: Money.parse('99.90'),
        currency: 'TRY',
        billingCycle: BillingCycle.yearly,
        startDate: DateTime(2026, 1, 15, 22, 30),
        nextRenewalDate: DateTime(2026, 10, 15),
        category: SubscriptionCategory.streaming,
        notes: ' not ',
        trialEndDate: DateTime(2026, 11, 1),
        trialPriceAfter: Money.parse('49.90'),
      );

      final request = supabase.requests.single;
      expect(request.method, 'POST');
      expect(request.path, '/rest/v1/rpc/create_subscription_idempotent');
      final body = request.json;
      expect(body['p_name'], 'Netflix');
      expect(body['p_amount'], '99.90');
      expect(body['p_billing_cycle'], 'yearly');
      expect(body['p_start_date'], '2026-01-15');
      expect(body['p_next_renewal_date'], '2026-10-15');
      expect(body['p_notes'], 'not');
      expect(body['p_trial_end_date'], '2026-11-01');
      expect(body['p_trial_price_after'], '49.90');
      expect(body['p_idempotency_key'], isNotEmpty);
      expect(created.id, 'yeni');
    });

    test('her çağrı yeni bir idempotency anahtarı üretir', () async {
      handler = (r) => MockSupabase.ok(_row());
      Future<void> call() => repo.create(
            userId: 'u1',
            name: 'A',
            amount: Money.parse('1'),
            currency: 'TRY',
            billingCycle: BillingCycle.monthly,
            startDate: DateTime(2026),
            nextRenewalDate: DateTime(2026, 2),
            category: SubscriptionCategory.other,
          );
      await call();
      await call();
      final keys = supabase.requests.map((r) => r.json['p_idempotency_key']);
      expect(keys.toSet(), hasLength(2));
    });

    test('sunucu hatası NetworkException olur', () async {
      handler = (r) => MockSupabase.error('duplicate key', status: 409);
      await expectLater(
        repo.create(
          userId: 'u1',
          name: 'A',
          amount: Money.parse('1'),
          currency: 'TRY',
          billingCycle: BillingCycle.monthly,
          startDate: DateTime(2026),
          nextRenewalDate: DateTime(2026, 2),
          category: SubscriptionCategory.other,
        ),
        throwsA(isA<NetworkException>()),
      );
    });
  });

  group('update ve durum geçişleri', () {
    test('update tam anlık görüntüyü RPC ile gönderir', () async {
      handler = (r) => MockSupabase.ok(_row(extra: {'name': 'Yeni ad'}));
      final updated = await repo.update(
        Subscription(
          id: 's1',
          userId: 'u1',
          name: 'Yeni ad',
          amount: Money.parse('10'),
          currency: 'USD',
          billingCycle: BillingCycle.weekly,
          startDate: DateTime(2026, 1, 1),
          nextRenewalDate: DateTime(2026, 2, 1),
          category: SubscriptionCategory.music,
          status: SubscriptionStatus.paused,
          notificationRules: const [NotificationRule(daysBefore: 7)],
          createdAt: DateTime(2026),
        ),
      );

      final request = supabase.requests.single;
      expect(request.path, '/rest/v1/rpc/update_subscription_idempotent');
      final body = request.json;
      expect(body['p_subscription_id'], 's1');
      expect(body['p_billing_cycle'], 'weekly');
      expect(body['p_status'], 'paused');
      expect(body['p_category'], 'music');
      expect(body['p_notification_rules'], hasLength(1));
      expect(updated.name, 'Yeni ad');
    });

    test('duraklat: mevcut satır okunur, yeni durumla güncellenir', () async {
      handler = (r) => r.path.endsWith('/subscriptions')
          ? MockSupabase.ok(_row())
          : MockSupabase.ok(_row(extra: {'status': 'paused'}));
      await repo.pause('u1', 's1');

      expect(supabase.requests, hasLength(2));
      final select = supabase.requests.first;
      expect(select.method, 'GET');
      expect(select.query['id'], 'eq.s1');
      expect(select.query['user_id'], 'eq.u1');
      final update = supabase.requests.last;
      expect(update.path, '/rest/v1/rpc/update_subscription_idempotent');
      expect(update.json['p_status'], 'paused');
    });

    test('arşivle/geri al/sürdür/iptal doğru durum anahtarını gönderir',
        () async {
      handler = (r) => r.path.endsWith('/subscriptions')
          ? MockSupabase.ok(_row())
          : MockSupabase.ok(_row());
      final expected = {
        'archive': 'archived',
        'restore': 'active',
        'resume': 'active',
        'cancel': 'cancelled',
      };
      final ops = {
        'archive': repo.archive,
        'restore': repo.restore,
        'resume': repo.resume,
        'cancel': repo.cancel,
      };
      for (final entry in ops.entries) {
        supabase.requests.clear();
        await entry.value('u1', 's1');
        expect(supabase.requests.last.json['p_status'], expected[entry.key],
            reason: entry.key);
      }
    });

    test('durum geçişinde satır okunamazsa NetworkException', () async {
      handler = (r) => MockSupabase.error('not found', status: 406);
      await expectLater(
          repo.cancel('u1', 'yok'), throwsA(isA<NetworkException>()));
    });
  });

  group('delete', () {
    test('yalnızca kullanıcının satırını siler', () async {
      handler = (r) => MockSupabase.ok(null, status: 204);
      await repo.delete('u1', 's1');
      final request = supabase.requests.single;
      expect(request.method, 'DELETE');
      expect(request.query['id'], 'eq.s1');
      expect(request.query['user_id'], 'eq.u1');
    });

    test('hata NetworkException olur', () async {
      handler = (r) => MockSupabase.error('denied', status: 403);
      await expectLater(
          repo.delete('u1', 's1'), throwsA(isA<NetworkException>()));
    });
  });
}
