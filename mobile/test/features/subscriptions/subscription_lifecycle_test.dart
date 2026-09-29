import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_lifecycle.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _sub(
  String id, {
  SubscriptionStatus status = SubscriptionStatus.active,
  DateTime? trialEnd,
  DateTime? start,
  required DateTime renewal,
}) =>
    Subscription(
      id: id,
      userId: 'u',
      name: id,
      amount: Money.parse('10'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: start ?? DateTime(2026, 1, 15),
      nextRenewalDate: renewal,
      category: SubscriptionCategory.other,
      status: status,
      trialEndDate: trialEnd,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  final now = DateTime(2026, 9, 15, 14, 30);

  test('endedTrials yalnızca bitiş günü geçmiş deneme aboneliklerini seçer',
      () {
    final items = [
      _sub('ended',
          status: SubscriptionStatus.trial,
          trialEnd: DateTime(2026, 9, 14),
          renewal: DateTime(2026, 9, 14)),
      _sub('today',
          status: SubscriptionStatus.trial,
          trialEnd: DateTime(2026, 9, 15),
          renewal: DateTime(2026, 9, 15)),
      _sub('active', renewal: DateTime(2026, 10, 1)),
    ];
    expect(
      SubscriptionLifecycle.endedTrials(items, now: now).map((s) => s.id),
      ['ended'],
    );
  });

  test('overdueRenewals yalnızca geçmiş tarihli aktif abonelikleri seçer', () {
    final items = [
      _sub('late', renewal: DateTime(2026, 9, 1)),
      _sub('ok', renewal: DateTime(2026, 9, 15)),
      _sub('paused',
          status: SubscriptionStatus.paused, renewal: DateTime(2026, 8, 1)),
    ];
    expect(
      SubscriptionLifecycle.overdueRenewals(items, now: now).map((s) => s.id),
      ['late'],
    );
  });

  test('advanceOverdue kaçırılan dönemleri tek adımda bugüne taşır', () {
    final s = _sub('late', renewal: DateTime(2026, 6, 15));
    final advanced = SubscriptionLifecycle.advanceOverdue(s, now: now);
    expect(advanced.nextRenewalDate, DateTime(2026, 9, 15));
  });

  test('markRenewed yarın veya sonrasına ilerletir', () {
    final s = _sub('a', renewal: DateTime(2026, 9, 15));
    final renewed = SubscriptionLifecycle.markRenewed(s, now: now);
    expect(renewed.nextRenewalDate, DateTime(2026, 10, 15));
  });
}
