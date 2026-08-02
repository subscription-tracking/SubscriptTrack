import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/calendar/presentation/calendar_controller.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _StaticRepo implements SubscriptionDataSource {
  _StaticRepo(this._items);
  final List<Subscription> _items;

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_items);

  @override
  Future<Subscription> create({
    required String userId, required String name, required Money amount,
    required String currency, required BillingCycle billingCycle,
    required DateTime startDate, required DateTime nextRenewalDate,
    required SubscriptionCategory category, String? notes,
  }) => throw UnimplementedError();

  @override Future<Subscription> update(Subscription updated) => throw UnimplementedError();
  @override Future<void> delete(String u, String id) => throw UnimplementedError();
  @override Future<void> archive(String u, String id) => throw UnimplementedError();
  @override Future<void> restore(String u, String id) => throw UnimplementedError();
  @override Future<void> pause(String u, String id) => throw UnimplementedError();
  @override Future<void> resume(String u, String id) => throw UnimplementedError();
  @override Future<void> cancel(String u, String id) => throw UnimplementedError();
}

// --- yardımcı -------------------------------------------------------

Subscription _sub(
  String id,
  DateTime renewalDate, {
  String currency = 'TRY',
  double amount = 100.0,
  BillingCycle cycle = BillingCycle.monthly,
  SubscriptionStatus status = SubscriptionStatus.active,
}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: 'Sub $id',
      amount: Money.fromJson(amount),
      currency: currency,
      billingCycle: cycle,
      startDate: DateTime(2025, 1, 1),
      nextRenewalDate: renewalDate,
      category: SubscriptionCategory.streaming,
      status: status,
      createdAt: DateTime(2025, 1, 1),
    );

Future<CalendarController> _ctrl(List<Subscription> subs) async {
  SharedPreferences.setMockInitialValues({});
  final subsCtrl = SubscriptionController(userId: 'u1', repository: _StaticRepo(subs));
  await subsCtrl.load();
  return CalendarController(subscriptions: subsCtrl);
}

// --- testler --------------------------------------------------------

void main() {
  group('CalendarController.renewalsForDay (S5)', () {
    test('o gün yenileme olan aboneliği döner', () async {
      final target = DateTime(2026, 8, 15);
      final cal = await _ctrl([_sub('1', target)]);
      final result = cal.renewalsForDay(target);
      expect(result.length, 1);
      expect(result.first.id, '1');
    });

    test('farklı gün → boş liste', () async {
      final cal = await _ctrl([_sub('1', DateTime(2026, 8, 15))]);
      expect(cal.renewalsForDay(DateTime(2026, 8, 14)), isEmpty);
    });

    test('paused abonelik dahil edilmez', () async {
      final d = DateTime(2026, 8, 15);
      final cal = await _ctrl([
        _sub('1', d),
        _sub('2', d, status: SubscriptionStatus.paused),
      ]);
      final result = cal.renewalsForDay(d);
      expect(result.length, 1);
      expect(result.first.id, '1');
    });

    test('aynı güne birden fazla abonelik', () async {
      final d = DateTime(2026, 8, 20);
      final cal = await _ctrl([_sub('1', d), _sub('2', d), _sub('3', d)]);
      expect(cal.renewalsForDay(d).length, 3);
    });

    test('UTC tarih yerel güne doğru düşer', () async {
      // UTC 2026-08-14T23:00:00Z → UTC+3 → 2026-08-15
      final utc = DateTime.utc(2026, 8, 14, 23, 0, 0);
      final local = utc.toLocal();
      final cal = await _ctrl([_sub('1', utc)]);
      // Yerel günde görünmeli
      final localDay = DateTime(local.year, local.month, local.day);
      expect(cal.renewalsForDay(localDay), isNotEmpty);
    });
  });

  group('CalendarController.renewalDaysInMonth (S5)', () {
    test('ilgili ay\'daki günleri döner', () async {
      final cal = await _ctrl([
        _sub('1', DateTime(2026, 8, 5)),
        _sub('2', DateTime(2026, 8, 20)),
        _sub('3', DateTime(2026, 9, 1)), // farklı ay → dahil değil
      ]);
      final days = cal.renewalDaysInMonth(2026, 8);
      expect(days.length, 2);
      expect(days.contains(DateTime(2026, 8, 5)), isTrue);
      expect(days.contains(DateTime(2026, 8, 20)), isTrue);
      expect(days.contains(DateTime(2026, 9, 1)), isFalse);
    });

    test('ay sınırı — son ve ilk günler doğru ayrılır', () async {
      final cal = await _ctrl([
        _sub('1', DateTime(2026, 7, 31)), // Temmuz son günü
        _sub('2', DateTime(2026, 8, 1)),  // Ağustos ilk günü
      ]);
      expect(cal.renewalDaysInMonth(2026, 7).length, 1);
      expect(cal.renewalDaysInMonth(2026, 8).length, 1);
    });

    test('boş liste → boş Set', () async {
      final cal = await _ctrl([]);
      expect(cal.renewalDaysInMonth(2026, 8), isEmpty);
    });
  });

  group('CalendarController.totalsByCurrencyForMonth (S4/S5)', () {
    test('tek para birimi — ayda gerçekleşen ödemeleri toplar', () async {
      final cal = await _ctrl([
        _sub('1', DateTime(2026, 8, 5), amount: 100),
        _sub('2', DateTime(2026, 8, 20), amount: 50),
        _sub('3', DateTime(2026, 9, 1), amount: 200), // bu ay değil
      ]);
      final totals = cal.totalsByCurrencyForMonth(2026, 8);
      expect(totals['TRY']?.minorUnits, 15000); // 150 TRY
      expect(totals.containsKey('USD'), isFalse);
    });

    test('çoklu para birimi ayrı toplanır', () async {
      final cal = await _ctrl([
        _sub('1', DateTime(2026, 8, 10), currency: 'TRY', amount: 100),
        _sub('2', DateTime(2026, 8, 15), currency: 'USD', amount: 10),
        _sub('3', DateTime(2026, 8, 20), currency: 'USD', amount: 5),
      ]);
      final totals = cal.totalsByCurrencyForMonth(2026, 8);
      expect(totals['TRY']?.minorUnits, 10000);
      expect(totals['USD']?.minorUnits, 1500);
    });

    test('o ayda yenileme yok → boş map', () async {
      final cal = await _ctrl([_sub('1', DateTime(2026, 9, 1))]);
      expect(cal.totalsByCurrencyForMonth(2026, 8), isEmpty);
    });
  });
}
