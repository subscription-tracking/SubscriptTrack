import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/data/subscription_realtime_sync.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _sub(String id) => Subscription(
      id: id,
      userId: 'u',
      name: id,
      amount: Money.parse('1'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: DateTime(2026, 10, 1),
      category: SubscriptionCategory.other,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  test('merge sunucu listesini alır ve yalnızca local- kayıtları korur', () {
    final current = [_sub('old-server'), _sub('local-1')];
    final server = [_sub('s1'), _sub('s2')];
    final merged = SubscriptionRealtimeSync.merge(current, server);
    expect(merged.map((s) => s.id), ['s1', 's2', 'local-1']);
  });

  test('yerel kayıt yoksa sunucu listesi aynen döner', () {
    final merged = SubscriptionRealtimeSync.merge([_sub('a')], [_sub('b')]);
    expect(merged.map((s) => s.id), ['b']);
  });
}
