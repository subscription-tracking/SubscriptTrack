import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _subscription(String currency, double amount) => Subscription(
      id: 'currency-$currency',
      userId: 'user-1',
      name: 'Test $currency',
      amount: Money.fromJson(amount),
      currency: currency,
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 9, 1),
      nextRenewalDate: DateTime(2026, 10, 1),
      category: SubscriptionCategory.other,
      createdAt: DateTime(2026, 9, 1),
    );

void main() {
  test('TRY/USD/EUR/GBP model round-trip preserves amount and currency', () {
    for (final entry in {'TRY': 199.99, 'USD': 12.50, 'EUR': 8.75, 'GBP': 10.00}.entries) {
      final original = _subscription(entry.key, entry.value);
      final restored = Subscription.fromJson(original.toJson());
      expect(restored.currency, entry.key);
      expect(restored.amount.minorUnits, original.amount.minorUnits);
    }
  });

  test('multi-currency totals remain separate and display with the right symbol', () {
    final totals = <String, Money>{};
    for (final sub in [
      _subscription('TRY', 100),
      _subscription('USD', 20),
      _subscription('EUR', 30),
      _subscription('GBP', 40),
    ]) {
      totals[sub.currency] = (totals[sub.currency] ?? Money.zero) + sub.amount;
    }
    expect(totals.keys, containsAll(<String>['TRY', 'USD', 'EUR', 'GBP']));
    expect(totals['TRY']!.minorUnits, 10000);
    expect(totals['USD']!.minorUnits, 2000);
    expect(totals['EUR']!.minorUnits, 3000);
    expect(totals['GBP']!.minorUnits, 4000);
    expect(DateTimeUtils.formatCurrency(totals['TRY']!.amount, symbol: 'TRY'), '₺100,00');
    expect(DateTimeUtils.formatCurrency(totals['USD']!.amount, symbol: 'USD'), '\$20,00');
    expect(DateTimeUtils.formatCurrency(totals['EUR']!.amount, symbol: 'EUR'), '€30,00');
    expect(DateTimeUtils.formatCurrency(totals['GBP']!.amount, symbol: 'GBP'), '£40,00');
  });
}
