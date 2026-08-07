import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

// --- Fake repo -----------------------------------------------------------

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  bool failNextCall = false;
  bool slowNextCall = false;
  bool failWithAuth = false;

  _FakeRepo(List<Subscription> data) : _data = List.of(data);

  @override
  Future<List<Subscription>> getAll(String userId) async {
    if (slowNextCall) await Future.delayed(const Duration(milliseconds: 10));
    if (failWithAuth) {
      failWithAuth = false;
      throw const AuthException('401 yetkisiz');
    }
    if (failNextCall) {
      failNextCall = false;
      throw Exception('ağ hatası');
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
  }) async {
    if (failNextCall) {
      failNextCall = false;
      throw Exception('ağ hatası');
    }
    final sub = Subscription(
      id: 'new-${_data.length}',
      userId: userId,
      name: name,
      amount: amount,
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      nextRenewalDate: nextRenewalDate,
      category: category,
      notes: notes,
      paymentMethod: paymentMethod,
      createdAt: DateTime.now(),
    );
    _data.add(sub);
    return sub;
  }

  @override
  Future<Subscription> update(Subscription updated) async {
    final idx = _data.indexWhere((s) => s.id == updated.id);
    if (idx != -1) _data[idx] = updated;
    return updated;
  }

  @override
  Future<void> delete(String userId, String subscriptionId) async =>
      _data.removeWhere((s) => s.id == subscriptionId);

  @override
  Future<void> archive(String userId, String subscriptionId) async =>
      _updateStatus(subscriptionId, SubscriptionStatus.archived);

  @override
  Future<void> restore(String userId, String subscriptionId) async =>
      _updateStatus(subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> pause(String userId, String subscriptionId) async =>
      _updateStatus(subscriptionId, SubscriptionStatus.paused);

  @override
  Future<void> resume(String userId, String subscriptionId) async =>
      _updateStatus(subscriptionId, SubscriptionStatus.active);

  @override
  Future<void> cancel(String userId, String subscriptionId) async =>
      _updateStatus(subscriptionId, SubscriptionStatus.cancelled);

  void _updateStatus(String id, SubscriptionStatus s) {
    final idx = _data.indexWhere((e) => e.id == id);
    if (idx != -1) _data[idx] = _data[idx].copyWith(status: s);
  }
}

// --- Test data -----------------------------------------------------------

Subscription _sub(String id, {SubscriptionStatus status = SubscriptionStatus.active}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: 'Sub $id',
      amount: Money.fromJson(50.0),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2025, 1, 1),
      nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
      category: SubscriptionCategory.streaming,
      status: status,
      createdAt: DateTime(2025, 1, 1),
    );

// --- Tests ---------------------------------------------------------------

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('SubscriptionController — yükleme (S4 dashboard)', () {
    test('load() başarılı → items gelir, error null, isOffline false', () async {
      final repo = _FakeRepo([_sub('1'), _sub('2')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);

      await ctrl.load();

      expect(ctrl.active.length, 2);
      expect(ctrl.error, isNull);
      expect(ctrl.isOffline, isFalse);
    });

    test('load() hata + cache yok → error set, isOffline false', () async {
      final repo = _FakeRepo([]);
      repo.failNextCall = true;
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);

      await ctrl.load();

      expect(ctrl.error, isNotNull);
      expect(ctrl.isOffline, isFalse);
      expect(ctrl.active, isEmpty);
    });

    test('load() hata + cache var → offline mode, items cache\'den gelir',
        () async {
      // İlk başarılı yükleme cache'i yazar
      final repo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      // İkinci yükleme başarısız → cache'den dönmeli
      repo.failNextCall = true;
      await ctrl.load();

      expect(ctrl.isOffline, isTrue);
      expect(ctrl.error, isNull);
      expect(ctrl.active.length, 1);
    });

    test('clearError() error\'u temizler', () async {
      final repo = _FakeRepo([]);
      repo.failNextCall = true;
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      expect(ctrl.error, isNotNull);
      ctrl.clearError();
      expect(ctrl.error, isNull);
    });
  });

  group('SubscriptionController — durum geçişleri (S3 yaşam döngüsü)', () {
    test('pause() → durum paused olur', () async {
      final repo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.pause('1');

      expect(ctrl.paused.any((s) => s.id == '1'), isTrue);
      expect(ctrl.active.any((s) => s.id == '1'), isFalse);
    });

    test('resume() → durum active olur', () async {
      final repo = _FakeRepo([_sub('1', status: SubscriptionStatus.paused)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.resume('1');

      expect(ctrl.active.any((s) => s.id == '1'), isTrue);
      expect(ctrl.paused.any((s) => s.id == '1'), isFalse);
    });

    test('cancel() → durum cancelled olur', () async {
      final repo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.cancel('1');

      expect(ctrl.cancelled.any((s) => s.id == '1'), isTrue);
      expect(ctrl.active.any((s) => s.id == '1'), isFalse);
    });

    test('archive() → durum archived olur, active listesinden çıkar', () async {
      final repo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.archive('1');

      expect(ctrl.archived.any((s) => s.id == '1'), isTrue);
      expect(ctrl.active.any((s) => s.id == '1'), isFalse);
    });

    test('restore() → archived → active olur', () async {
      final repo =
          _FakeRepo([_sub('1', status: SubscriptionStatus.archived)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.restore('1');

      expect(ctrl.active.any((s) => s.id == '1'), isTrue);
      expect(ctrl.archived.any((s) => s.id == '1'), isFalse);
    });

    test('delete() → listeden kalkar', () async {
      final repo = _FakeRepo([_sub('1'), _sub('2')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.delete('1');

      expect(ctrl.active.any((s) => s.id == '1'), isFalse);
      expect(ctrl.active.length, 1);
    });
  });

  group('SubscriptionController — hesaplamalar (S4 finansal)', () {
    test('totalMonthly boş liste → Money.zero', () async {
      final ctrl = SubscriptionController(userId: 'u1', repository: _FakeRepo([]));
      await ctrl.load();
      expect(ctrl.totalMonthly.minorUnits, 0);
    });

    test('totalMonthly iki aylık abonelik → toplar', () async {
      final subs = [_sub('1'), _sub('2')];
      final ctrl = SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
      await ctrl.load();
      // Her biri 50 TRY aylık → toplam 100 TRY = 10000 minor
      expect(ctrl.totalMonthly.minorUnits, 10000);
    });

    test('totalsByCurrency para birimi ayrıştırır', () async {
      final try1 = _sub('1');
      final usd1 = Subscription(
        id: '2',
        userId: 'u1',
        name: 'USD Sub',
        amount: Money.fromJson(10.0),
        currency: 'USD',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2025, 1, 1),
        nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
        category: SubscriptionCategory.software,
        createdAt: DateTime(2025, 1, 1),
      );
      final ctrl =
          SubscriptionController(userId: 'u1', repository: _FakeRepo([try1, usd1]));
      await ctrl.load();

      final totals = ctrl.totalsByCurrency;
      expect(totals.containsKey('TRY'), isTrue);
      expect(totals.containsKey('USD'), isTrue);
      expect(totals['TRY']!.minorUnits, 5000);
      expect(totals['USD']!.minorUnits, 1000);
    });

    test('paused abonelikler totalMonthly\'e dahil değil', () async {
      final subs = [
        _sub('1'), // active 50 TRY
        _sub('2', status: SubscriptionStatus.paused), // paused → sayılmaz
      ];
      final ctrl = SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
      await ctrl.load();
      expect(ctrl.totalMonthly.minorUnits, 5000);
    });
  });

  group('SubscriptionController — S9 entegrasyon', () {
    test('load() 401 → onUnauthorized çağrılır', () async {
      final repo = _FakeRepo([]);
      repo.failWithAuth = true;
      bool called = false;
      final ctrl = SubscriptionController(
          userId: 'u1',
          repository: repo,
          onUnauthorized: () => called = true);

      await ctrl.load();

      expect(called, isTrue);
    });

    test('load() zaten yükleniyor → ikinci çağrı ignore edilir (dedup)', () async {
      final repo = _FakeRepo([_sub('1')]);
      repo.slowNextCall = true;
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);

      // İki paralel çağrı — sadece biri çalışmalı
      final f1 = ctrl.load();
      final f2 = ctrl.load(); // dedup: hemen döner
      await Future.wait([f1, f2]);

      expect(ctrl.active.length, 1);
    });

    test('transition guard — paused → paused reddedilir', () async {
      final repo = _FakeRepo([_sub('1', status: SubscriptionStatus.paused)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await expectLater(
        () => ctrl.pause('1'),
        throwsA(isA<ValidationException>()),
      );
    });

    test('transition guard — cancelled → paused reddedilir', () async {
      final repo =
          _FakeRepo([_sub('1', status: SubscriptionStatus.cancelled)]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await expectLater(
        () => ctrl.pause('1'),
        throwsA(isA<ValidationException>()),
      );
    });

    test('transition guard — active → paused geçer', () async {
      final repo = _FakeRepo([_sub('1')]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      await ctrl.pause('1');

      expect(ctrl.paused.any((s) => s.id == '1'), isTrue);
    });
  });

  group('SubscriptionController — add() (S2 form → kayıt)', () {
    test('add() başarılı → active listesine eklenir', () async {
      final ctrl =
          SubscriptionController(userId: 'u1', repository: _FakeRepo([]));
      await ctrl.load();

      final ok = await ctrl.add(
        name: 'Spotify',
        amount: Money.parse('29,99'),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2025, 1, 1),
        nextRenewalDate: DateTime.now().add(const Duration(days: 5)),
        category: SubscriptionCategory.music,
      );

      expect(ok, isTrue);
      expect(ctrl.active.any((s) => s.name == 'Spotify'), isTrue);
    });

    test('add() başarısız (repo exception) → false döner, error set', () async {
      final repo = _FakeRepo([]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();

      repo.failNextCall = true;
      final ok = await ctrl.add(
        name: 'Fail',
        amount: Money.fromJson(10.0),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2025, 1, 1),
        nextRenewalDate: DateTime.now().add(const Duration(days: 5)),
        category: SubscriptionCategory.other,
      );

      expect(ok, isFalse);
      expect(ctrl.error, isNotNull);
    });
  });
}
