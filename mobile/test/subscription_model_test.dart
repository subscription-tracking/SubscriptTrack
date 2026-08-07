import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _makeSubscription({
  String id = 'sub-1',
  String name = 'Netflix',
  double amount = 49.90,
  String currency = 'TRY',
  BillingCycle billingCycle = BillingCycle.monthly,
  SubscriptionStatus status = SubscriptionStatus.active,
  String? notes,
  String? paymentMethod,
}) =>
    Subscription(
      id: id,
      userId: 'user-1',
      name: name,
      amount: Money.fromJson(amount),
      currency: currency,
      billingCycle: billingCycle,
      startDate: DateTime(2025, 1, 1),
      nextRenewalDate: DateTime(2026, 8, 1),
      category: SubscriptionCategory.streaming,
      notes: notes,
      paymentMethod: paymentMethod,
      status: status,
      createdAt: DateTime(2025, 1, 1),
    );

void main() {
  group('Subscription JSON round-trip (S2 contract)', () {
    test('aktif abonelik round-trip', () {
      final sub = _makeSubscription();
      final roundTripped = Subscription.fromJson(sub.toJson());

      expect(roundTripped.id, sub.id);
      expect(roundTripped.userId, sub.userId);
      expect(roundTripped.name, sub.name);
      expect(roundTripped.amount.minorUnits, sub.amount.minorUnits);
      expect(roundTripped.currency, sub.currency);
      expect(roundTripped.billingCycle, sub.billingCycle);
      expect(roundTripped.startDate, sub.startDate);
      expect(roundTripped.nextRenewalDate, sub.nextRenewalDate);
      expect(roundTripped.category, sub.category);
      expect(roundTripped.status, sub.status);
      expect(roundTripped.notes, sub.notes);
      expect(roundTripped.paymentMethod, sub.paymentMethod);
    });

    test('ödeme yöntemi / kart adı korunur', () {
      final sub = _makeSubscription(paymentMethod: 'Garanti Bonus');
      final rt = Subscription.fromJson(sub.toJson());
      expect(rt.paymentMethod, 'Garanti Bonus');
    });

    test('duraklatılmış durum korunur', () {
      final sub = _makeSubscription(status: SubscriptionStatus.paused);
      final rt = Subscription.fromJson(sub.toJson());
      expect(rt.status, SubscriptionStatus.paused);
    });

    test('iptal edilmiş durum korunur', () {
      final sub = _makeSubscription(status: SubscriptionStatus.cancelled);
      final rt = Subscription.fromJson(sub.toJson());
      expect(rt.status, SubscriptionStatus.cancelled);
    });

    test('arşivlenmiş durum korunur', () {
      final sub = _makeSubscription(status: SubscriptionStatus.archived);
      final rt = Subscription.fromJson(sub.toJson());
      expect(rt.status, SubscriptionStatus.archived);
    });

    test('notlar null korunur', () {
      final sub = _makeSubscription(notes: null);
      expect(Subscription.fromJson(sub.toJson()).notes, isNull);
    });

    test('notlar dolu korunur', () {
      final sub = _makeSubscription(notes: 'aile planı');
      expect(Subscription.fromJson(sub.toJson()).notes, 'aile planı');
    });

    test('tüm billing cycle değerleri serialize edilir', () {
      for (final cycle in BillingCycle.values) {
        final sub = _makeSubscription(billingCycle: cycle);
        final rt = Subscription.fromJson(sub.toJson());
        expect(rt.billingCycle, cycle, reason: '${cycle.key} korunmadı');
      }
    });

    test('tüm para birimleri korunur', () {
      for (final cur in ['TRY', 'USD', 'EUR', 'GBP']) {
        final sub = _makeSubscription(currency: cur);
        expect(Subscription.fromJson(sub.toJson()).currency, cur);
      }
    });

    test('toJson amount string olarak çıkar (Money integer-minor-unit sözleşmesi)', () {
      final sub = _makeSubscription(amount: 12.50);
      final json = sub.toJson();
      // Money.toJson() returns a decimal string to avoid floating-point drift.
      expect(json['amount'], isA<String>());
      expect(double.parse(json['amount'] as String), closeTo(12.50, 0.001));
    });
  });

  group('Subscription monthlyAmount hesaplama (S4)', () {
    test('aylık → aynı tutar', () {
      final sub = _makeSubscription(amount: 100, billingCycle: BillingCycle.monthly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });

    test('yıllık → 12\'ye bölünür', () {
      final sub = _makeSubscription(amount: 1200, billingCycle: BillingCycle.yearly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });

    test('haftalık → 4.33 ile çarpılır', () {
      final sub = _makeSubscription(amount: 100, billingCycle: BillingCycle.weekly);
      expect(sub.monthlyAmount.minorUnits, (10000 * 4.33).round());
    });

    test('3 aylık → 3\'e bölünür', () {
      final sub = _makeSubscription(amount: 300, billingCycle: BillingCycle.quarterly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });
  });

  group('SubscriptionStatus enum', () {
    test('fromKey bilinmeyen key → active döner', () {
      expect(SubscriptionStatusExt.fromKey('unknown'), SubscriptionStatus.active);
    });

    test('tüm status key\'leri round-trip', () {
      for (final s in SubscriptionStatus.values) {
        expect(SubscriptionStatusExt.fromKey(s.key), s);
      }
    });
  });

  group('BillingCycle enum', () {
    test('fromKey bilinmeyen → monthly döner', () {
      expect(BillingCycleLabel.fromKey('unknown'), BillingCycle.monthly);
    });

    test('tüm cycle key\'leri round-trip', () {
      for (final c in BillingCycle.values) {
        expect(BillingCycleLabel.fromKey(c.key), c);
      }
    });
  });
}
