import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

// ── Fake repo ──────────────────────────────────────────────────────────────

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  bool failNextCall = false;

  _FakeRepo(this._data);

  @override
  Future<List<Subscription>> getAll(String userId) async {
    if (failNextCall) {
      failNextCall = false;
      throw Exception('network error');
    }
    return List.of(_data);
  }

  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
  }) =>
      throw UnimplementedError();

  @override
  Future<Subscription> update(Subscription u) => throw UnimplementedError();
  @override
  Future<void> delete(String u, String id) => throw UnimplementedError();
  @override
  Future<void> archive(String u, String id) => throw UnimplementedError();
  @override
  Future<void> restore(String u, String id) => throw UnimplementedError();
  @override
  Future<void> pause(String u, String id) => throw UnimplementedError();
  @override
  Future<void> resume(String u, String id) => throw UnimplementedError();
  @override
  Future<void> cancel(String u, String id) => throw UnimplementedError();
}

Subscription _sub(
  String id, {
  double amount = 100,
  String currency = 'TRY',
  BillingCycle cycle = BillingCycle.monthly,
  SubscriptionStatus status = SubscriptionStatus.active,
  int daysFromNow = 10,
}) {
  return Subscription(
    id: id,
    userId: 'u1',
    name: 'Sub $id',
    amount: Money.fromJson(amount),
    currency: currency,
    billingCycle: cycle,
    startDate: DateTime(2025, 1, 1),
    nextRenewalDate: DateTime.now().add(Duration(days: daysFromNow)),
    category: SubscriptionCategory.other,
    status: status,
    createdAt: DateTime(2025, 1, 1),
  );
}

Future<SubscriptionController> _loadedCtrl(List<Subscription> subs) async {
  SharedPreferences.setMockInitialValues({});
  final ctrl =
      SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
  await ctrl.load();
  return ctrl;
}

// ── Testler ────────────────────────────────────────────────────────────────

void main() {
  group('Subscription.daysUntilRenewal (S4)', () {
    test('gelecek → pozitif gün', () {
      final sub = _sub('1', daysFromNow: 5);
      expect(sub.daysUntilRenewal, greaterThanOrEqualTo(4));
    });

    test('geçmiş → negatif gün', () {
      final sub = _sub('1', daysFromNow: -3);
      expect(sub.daysUntilRenewal, lessThan(0));
    });

    test('bugün → 0 gün', () {
      final sub = Subscription(
        id: 'x',
        userId: 'u',
        name: 'X',
        amount: Money.fromJson(10.0),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2025, 1, 1),
        nextRenewalDate: DateTime.now(),
        category: SubscriptionCategory.other,
        createdAt: DateTime(2025, 1, 1),
      );
      expect(sub.daysUntilRenewal, 0);
    });
  });

  group('SubscriptionController.totalsByCurrency (S4)', () {
    test('tek para birimi — toplam doğru', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', amount: 100, currency: 'TRY'),
        _sub('2', amount: 50, currency: 'TRY'),
      ]);
      final totals = ctrl.totalsByCurrency;
      expect(totals.length, 1);
      expect(totals['TRY']?.minorUnits, 15000); // 150 TRY
    });

    test('çoklu para birimi — ayrı toplanır, karıştırılmaz', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', amount: 100, currency: 'TRY'),
        _sub('2', amount: 10, currency: 'USD'),
        _sub('3', amount: 5, currency: 'USD'),
      ]);
      final totals = ctrl.totalsByCurrency;
      expect(totals['TRY']?.minorUnits, 10000);
      expect(totals['USD']?.minorUnits, 1500);
    });

    test('paused abonelikler dahil edilmez', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', amount: 100, currency: 'TRY'),
        _sub('2',
            amount: 200, currency: 'TRY', status: SubscriptionStatus.paused),
      ]);
      expect(ctrl.totalsByCurrency['TRY']?.minorUnits, 10000);
    });

    test('boş liste → boş map', () async {
      final ctrl = await _loadedCtrl([]);
      expect(ctrl.totalsByCurrency, isEmpty);
    });
  });

  group('SubscriptionController.upcomingRenewals (S4)', () {
    test('30 gün içindeki aktif abonelikler dahil', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', daysFromNow: 5),
        _sub('2', daysFromNow: 30),
      ]);
      expect(ctrl.upcomingRenewals.length, 2);
    });

    test('31+ gün → dahil değil', () async {
      // 31 gün = inDays 30 verebilir; kesin olması için 45 kullan.
      final ctrl = await _loadedCtrl([
        _sub('1', daysFromNow: 45),
      ]);
      expect(ctrl.upcomingRenewals, isEmpty);
    });

    test('geçmiş tarihli → dahil değil', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', daysFromNow: -1),
      ]);
      expect(ctrl.upcomingRenewals, isEmpty);
    });

    test('paused → upcomingRenewals\'a girmez', () async {
      final ctrl = await _loadedCtrl([
        _sub('1', status: SubscriptionStatus.paused, daysFromNow: 5),
      ]);
      expect(ctrl.upcomingRenewals, isEmpty);
    });
  });

  group('SubscriptionController.active / paused / cancelled / archived (S3)',
      () {
    test('statüye göre doğru gruplar', () async {
      final ctrl = await _loadedCtrl([
        _sub('a', status: SubscriptionStatus.active),
        _sub('b', status: SubscriptionStatus.paused),
        _sub('c', status: SubscriptionStatus.cancelled),
        _sub('d', status: SubscriptionStatus.archived),
      ]);
      expect(ctrl.active.length, 1);
      expect(ctrl.paused.length, 1);
      expect(ctrl.cancelled.length, 1);
      expect(ctrl.archived.length, 1);
    });

    test('active sıralama: yakın yenileme önce', () async {
      final ctrl = await _loadedCtrl([
        _sub('late', daysFromNow: 20),
        _sub('soon', daysFromNow: 3),
      ]);
      expect(ctrl.active.first.id, 'soon');
    });
  });

  group('SubscriptionController.isOffline (S11)', () {
    test('başarılı load → isOffline false', () async {
      final ctrl = await _loadedCtrl([_sub('1')]);
      expect(ctrl.isOffline, isFalse);
    });

    test('cache varken repo hatası → isOffline true', () async {
      // isOffline=true ancak cache varsa döner. Önce başarılı yükle
      // (cache yazar), sonra hatalı repo ile yükle.
      SharedPreferences.setMockInitialValues({});
      final fakeRepo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: fakeRepo);
      await ctrl.load(); // cache'e yazar

      // Sonraki çağrıda repo hata fırlatır
      fakeRepo.failNextCall = true;
      await ctrl.load();
      expect(ctrl.isOffline, isTrue);
    });
  });
}
