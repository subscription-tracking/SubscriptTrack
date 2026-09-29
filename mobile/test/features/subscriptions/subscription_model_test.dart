import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
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
  group('Gelecekte başlayan abonelik (Senaryo 6)', () {
    test('gelecekteki aktif kayıt türetilen henüz başlamadı durumundadır', () {
      final subscription = _makeSubscription().copyWith(
        startDate: DateTime(2026, 10, 1),
      );

      expect(subscription.isNotStartedAt(DateTime(2026, 9, 18)), isTrue);
      expect(subscription.isNotStartedAt(DateTime(2026, 10, 1)), isFalse);
    });

    test(
        'duraklatılmış kayıt başlangıç tarihi ileri olsa da henüz başlamadı değildir',
        () {
      final subscription = _makeSubscription(
        status: SubscriptionStatus.paused,
      ).copyWith(startDate: DateTime(2026, 10, 1));

      expect(subscription.isNotStartedAt(DateTime(2026, 9, 18)), isFalse);
    });
  });

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

    test(
        'toJson amount string olarak çıkar (Money integer-minor-unit sözleşmesi)',
        () {
      final sub = _makeSubscription(amount: 12.50);
      final json = sub.toJson();
      // Money.toJson() returns a decimal string to avoid floating-point drift.
      expect(json['amount'], isA<String>());
      expect(double.parse(json['amount'] as String), closeTo(12.50, 0.001));
    });
  });

  group('Subscription monthlyAmount hesaplama (S4)', () {
    test('aylık → aynı tutar', () {
      final sub =
          _makeSubscription(amount: 100, billingCycle: BillingCycle.monthly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });

    test('yıllık → 12\'ye bölünür', () {
      final sub =
          _makeSubscription(amount: 1200, billingCycle: BillingCycle.yearly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });

    test('haftalık → 52 / 12 ile aylıklaştırılır', () {
      final sub =
          _makeSubscription(amount: 100, billingCycle: BillingCycle.weekly);
      expect(sub.monthlyAmount.minorUnits, 43333);
    });

    test('3 aylık → 3\'e bölünür', () {
      final sub =
          _makeSubscription(amount: 300, billingCycle: BillingCycle.quarterly);
      expect(sub.monthlyAmount.minorUnits, 10000);
    });
  });

  group('Subscription renewal projection (S05/S42)', () {
    test('31 Ocak aylık abonelik kısa aydan sonra 31 Marta döner', () {
      final sub = Subscription(
        id: 'month-end',
        userId: 'user-1',
        name: 'Month end',
        amount: Money.parse('100.00'),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2026, 1, 31),
        nextRenewalDate: DateTime(2026, 1, 31),
        category: SubscriptionCategory.other,
        createdAt: DateTime(2026, 1, 31),
      );

      expect(sub.projectedRenewals(count: 4), [
        DateTime(2026, 1, 31),
        DateTime(2026, 2, 28),
        DateTime(2026, 3, 31),
        DateTime(2026, 4, 30),
      ]);
    });

    test('gecikmiş kısa ay yenilemesi başlangıç gününe döner', () {
      expect(
        DateTimeUtils.nextOccurrenceOnOrAfter(
          DateTime(2026, 2, 28),
          'monthly',
          DateTime(2026, 3, 1),
          originalAnchor: DateTime(2026, 1, 31),
        ),
        DateTime(2026, 3, 31),
      );
    });
  });

  group('SubscriptionStatus enum', () {
    test('fromKey bilinmeyen key → active döner', () {
      expect(
          SubscriptionStatusExt.fromKey('unknown'), SubscriptionStatus.active);
    });

    test('tüm status key\'leri round-trip', () {
      for (final s in SubscriptionStatus.values) {
        expect(SubscriptionStatusExt.fromKey(s.key), s);
      }
    });

    test('trial ve expired geçişleri desteklenir', () {
      expect(
          SubscriptionStatus.trial.canTransitionTo(SubscriptionStatus.active),
          isTrue);
      expect(
          SubscriptionStatus.trial.canTransitionTo(SubscriptionStatus.expired),
          isTrue);
      expect(
          SubscriptionStatus.expired.canTransitionTo(SubscriptionStatus.active),
          isTrue);
      expect(
          SubscriptionStatus.active.canTransitionTo(SubscriptionStatus.expired),
          isFalse);
    });

    test('trial alanları JSON round-trip korunur', () {
      final sub = Subscription(
        id: 'trial-1',
        userId: 'user-1',
        name: 'Trial',
        amount: Money.fromJson(1),
        currency: 'TRY',
        billingCycle: BillingCycle.monthly,
        startDate: DateTime(2026, 9, 1),
        nextRenewalDate: DateTime(2026, 10, 1),
        category: SubscriptionCategory.software,
        status: SubscriptionStatus.trial,
        trialEndDate: DateTime(2026, 9, 15),
        trialPriceAfter: Money.fromJson(99),
        createdAt: DateTime(2026, 9, 1),
      );
      final rt = Subscription.fromJson(sub.toJson());
      expect(rt.status, SubscriptionStatus.trial);
      expect(rt.trialEndDate, DateTime(2026, 9, 15));
      expect(rt.trialPriceAfter?.minorUnits, 9900);
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
