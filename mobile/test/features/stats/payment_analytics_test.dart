import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/stats/data/payment_events_repository.dart';
import 'package:subscript_track/features/stats/domain/payment_analytics.dart';

PaymentEvent _event(String amount, DateTime paidAt,
        {String currency = 'TRY'}) =>
    PaymentEvent(
      id: '$amount-$paidAt-$currency',
      subscriptionId: 's',
      amount: Money.parse(amount),
      currency: currency,
      paidAt: paidAt,
    );

void main() {
  final now = DateTime(2026, 9, 15);

  group('PaymentAnalytics.monthlyTotals', () {
    test('ay bazında minor unit toplar, sıra eskiden yeniye', () {
      final events = [
        _event('10.10', DateTime(2026, 9, 2)),
        _event('0.20', DateTime(2026, 9, 3)),
        _event('5', DateTime(2026, 8, 30)),
      ];
      expect(
        PaymentAnalytics.monthlyTotals(events, 'TRY', months: 3, now: now),
        [0, 500, 1030],
      );
    });

    test('kayan nokta hatası üretmez (0.1 + 0.2)', () {
      final events = [
        _event('0.10', DateTime(2026, 9, 1)),
        _event('0.20', DateTime(2026, 9, 2)),
      ];
      expect(PaymentAnalytics.totalForMonth(events, 'TRY', now), 30);
    });

    test('farklı para birimlerini karıştırmaz', () {
      final events = [
        _event('10', DateTime(2026, 9, 2)),
        _event('99', DateTime(2026, 9, 2), currency: 'USD'),
      ];
      expect(
        PaymentAnalytics.monthlyTotals(events, 'TRY', months: 1, now: now),
        [1000],
      );
    });

    test('yıl sınırını doğru geçer', () {
      final january = DateTime(2026, 1, 20);
      final events = [_event('7', DateTime(2025, 12, 5))];
      expect(
        PaymentAnalytics.monthlyTotals(events, 'TRY', months: 2, now: january),
        [700, 0],
      );
    });
  });

  group('PaymentAnalytics.monthOverMonthPercent', () {
    test('olay yoksa null', () {
      expect(
          PaymentAnalytics.monthOverMonthPercent(const [], now: now), isNull);
    });

    test('geçen ay 0 ise null', () {
      final events = [_event('10', DateTime(2026, 9, 2))];
      expect(PaymentAnalytics.monthOverMonthPercent(events, now: now), isNull);
    });

    test('artış ve azalış yüzdesi', () {
      final up = [
        _event('100', DateTime(2026, 8, 2)),
        _event('150', DateTime(2026, 9, 2)),
      ];
      expect(PaymentAnalytics.monthOverMonthPercent(up, now: now), 50);
      final down = [
        _event('100', DateTime(2026, 8, 2)),
        _event('75', DateTime(2026, 9, 2)),
      ];
      expect(PaymentAnalytics.monthOverMonthPercent(down, now: now), -25);
    });

    test('para birimi verilince yalnız o birim hesaplanır', () {
      final events = [
        _event('100', DateTime(2026, 8, 2)),
        _event('200', DateTime(2026, 9, 2)),
        _event('10', DateTime(2026, 8, 2), currency: 'USD'),
        _event('10', DateTime(2026, 9, 2), currency: 'USD'),
      ];
      expect(
        PaymentAnalytics.monthOverMonthPercent(events,
            currency: 'USD', now: now),
        0,
      );
    });
  });
}
