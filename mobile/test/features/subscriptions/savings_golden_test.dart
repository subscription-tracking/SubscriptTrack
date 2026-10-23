import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_lifecycle.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

void main() {
  final fixture = jsonDecode(
    File('../testdata/flutter_expo_domain_goldens.json').readAsStringSync(),
  ) as Map<String, dynamic>;

  test('Ortak Flutter–Expo tasarruf aylıklaştırma altın senaryoları', () {
    for (final raw in fixture['savings'] as List<dynamic>) {
      final item = raw as Map<String, dynamic>;
      final amount = Money.parse(item['amount'] as String);
      final cycle = BillingCycleLabel.fromKey(item['billingCycle'] as String);
      final subscription = Subscription(
        id: 'golden',
        userId: 'test-user',
        name: 'Golden subscription',
        amount: amount,
        currency: item['currency'] as String,
        billingCycle: cycle,
        startDate: DateTime(2026, 1, 31),
        nextRenewalDate: DateTime(2026, 10, 31),
        category: SubscriptionCategory.other,
        createdAt: DateTime(2026, 1, 31),
      );
      final monthly = subscription.monthlyAmount;
      final annual = monthly * 12;

      expect(monthly.decimalString, item['monthly']);
      expect(annual.decimalString, item['annual']);
    }
  });

  test('Ortak Flutter–Expo kullanıcı onaylı yenileme altın senaryoları', () {
    String date(DateTime value) =>
        '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';

    for (final raw in fixture['renewalConfirmations'] as List<dynamic>) {
      final item = raw as Map<String, dynamic>;
      final subscription = Subscription(
        id: 'golden',
        userId: 'test-user',
        name: 'Golden subscription',
        amount: Money.parse('10.00'),
        currency: 'TRY',
        billingCycle: BillingCycleLabel.fromKey(item['billingCycle'] as String),
        startDate: DateTime.parse(item['start'] as String),
        nextRenewalDate: DateTime.parse(item['due'] as String),
        category: SubscriptionCategory.other,
        status: SubscriptionStatus.active,
        createdAt: DateTime.parse(item['start'] as String),
      );
      final confirmed = SubscriptionLifecycle.markRenewed(
        subscription,
        now: DateTime.parse(item['today'] as String),
      );
      expect(date(confirmed.nextRenewalDate), item['expected']);
    }
  });
}
