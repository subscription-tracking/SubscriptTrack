import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_selectors.dart';

Subscription _sub(
  String id,
  String amount, {
  String currency = 'TRY',
  SubscriptionStatus status = SubscriptionStatus.active,
  DateTime? renewal,
}) =>
    Subscription(
      id: id,
      userId: 'u',
      name: id,
      amount: Money.parse(amount),
      currency: currency,
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: renewal ?? DateTime(2026, 10, 1),
      category: SubscriptionCategory.other,
      status: status,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  test('durumlara göre ayırır ve aktifleri yenileme tarihine göre sıralar', () {
    final selectors = SubscriptionSelectors([
      _sub('b', '1', renewal: DateTime(2026, 11, 1)),
      _sub('a', '1', renewal: DateTime(2026, 10, 1)),
      _sub('p', '1', status: SubscriptionStatus.paused),
      _sub('c', '1', status: SubscriptionStatus.cancelled),
      _sub('x', '1', status: SubscriptionStatus.expired),
      _sub('r', '1', status: SubscriptionStatus.archived),
    ]);
    expect(selectors.active.map((s) => s.id), ['a', 'b']);
    expect(selectors.paused.single.id, 'p');
    expect(selectors.cancelled.single.id, 'c');
    expect(selectors.expired.single.id, 'x');
    expect(selectors.archived.single.id, 'r');
  });

  test('totalsByCurrency para birimlerini karıştırmaz', () {
    final selectors = SubscriptionSelectors([
      _sub('a', '10.10'),
      _sub('b', '0.20'),
      _sub('c', '5', currency: 'USD'),
      _sub('d', '99', status: SubscriptionStatus.paused),
    ]);
    expect(selectors.totalsByCurrency['TRY'], Money.parse('10.30'));
    expect(selectors.totalsByCurrency['USD'], Money.parse('5'));
  });

  test('totalMonthly yalnızca ilk aktif aboneliğin para birimini toplar', () {
    final selectors = SubscriptionSelectors([
      _sub('a', '10', renewal: DateTime(2026, 10, 1)),
      _sub('b', '5', currency: 'USD', renewal: DateTime(2026, 10, 2)),
    ]);
    expect(selectors.totalMonthly, Money.parse('10'));
    expect(SubscriptionSelectors(const []).totalMonthly, Money.zero);
  });

  test('sonuçlar önbelleğe alınır (aynı örnek)', () {
    final selectors = SubscriptionSelectors([_sub('a', '1')]);
    expect(identical(selectors.active, selectors.active), isTrue);
  });
}
