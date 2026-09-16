import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/core/domain/money.dart';

void main() {
  test('monthly subscription projects future renewal dates', () {
    final subscription = Subscription(
      id: 's', userId: 'u', name: 'Netflix', amount: Money.parse('250'),
      currency: 'TRY', billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 9, 16), nextRenewalDate: DateTime(2026, 10, 16),
      category: SubscriptionCategory.streaming, createdAt: DateTime(2026, 9, 16),
    );
    expect(subscription.projectedRenewals(count: 3), [
      DateTime(2026, 10, 16), DateTime(2026, 11, 16), DateTime(2026, 12, 16),
    ]);
  });
}
