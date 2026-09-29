import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/stats/domain/stats_view_model.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _sub(
  String id,
  String amount, {
  String currency = 'TRY',
  SubscriptionCategory category = SubscriptionCategory.other,
  required DateTime renewal,
}) =>
    Subscription(
      id: id,
      userId: 'u',
      name: id,
      amount: Money.parse(amount),
      currency: currency,
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: renewal,
      category: category,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  final now = DateTime(2026, 9, 15);

  test('totals boşsa null döner', () {
    expect(
      StatsViewModel.build(
        totals: const {},
        active: const [],
        paymentEvents: const [],
        now: now,
      ),
      isNull,
    );
  });

  test('seçili para birimi geçersizse ilkine düşer', () {
    final subs = [
      _sub('a', '10', renewal: DateTime(2026, 9, 20)),
      _sub('b', '5', currency: 'USD', renewal: DateTime(2026, 9, 20)),
    ];
    final model = StatsViewModel.build(
      totals: {'TRY': Money.parse('10'), 'USD': Money.parse('5')},
      active: subs,
      paymentEvents: const [],
      selectedCurrency: 'EUR',
      now: now,
    )!;
    expect(model.currency, 'TRY');
    expect(model.availableCurrencies, ['TRY', 'USD']);
    expect(model.yearly, Money.parse('120'));
    expect(model.activeCount, 1);
  });

  test('yaklaşan yenilemeler 7 gün içinde, en fazla 3, tarihe göre sıralı', () {
    final subs = [
      _sub('far', '1', renewal: DateTime(2026, 10, 30)),
      _sub('d5', '1', renewal: DateTime(2026, 9, 20)),
      _sub('d2', '1', renewal: DateTime(2026, 9, 17)),
      _sub('d3', '1', renewal: DateTime(2026, 9, 18)),
      _sub('d6', '1', renewal: DateTime(2026, 9, 21)),
    ];
    final model = StatsViewModel.build(
      totals: {'TRY': Money.parse('5')},
      active: subs,
      paymentEvents: const [],
      now: now,
    )!;
    expect(model.dueSoon.map((s) => s.id), ['d2', 'd3', 'd5']);
  });

  test('kategori dağılımı büyükten küçüğe ve para birimine göre', () {
    final subs = [
      _sub('a', '10',
          category: SubscriptionCategory.streaming,
          renewal: DateTime(2026, 10, 1)),
      _sub('b', '30',
          category: SubscriptionCategory.music, renewal: DateTime(2026, 10, 1)),
      _sub('c', '99',
          currency: 'USD',
          category: SubscriptionCategory.music,
          renewal: DateTime(2026, 10, 1)),
    ];
    final entries = StatsViewModel.categoryBreakdown(subs, 'TRY');
    expect(entries.map((e) => e.key),
        [SubscriptionCategory.music, SubscriptionCategory.streaming]);
    expect(entries.first.value, Money.parse('30'));
  });
}
