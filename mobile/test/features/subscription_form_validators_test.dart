import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form_validators.dart';

void main() {
  final subscriptionLimit = (jsonDecode(
    File('../testdata/flutter_expo_domain_goldens.json').readAsStringSync(),
  ) as Map<String, dynamic>)['subscriptionAmountLimits']
      as Map<String, dynamic>;

  test('ad boş olamaz', () {
    expect(SubscriptionFormValidators.name(null), 'Ad boş olamaz');
    expect(SubscriptionFormValidators.name('  '), 'Ad boş olamaz');
    expect(SubscriptionFormValidators.name('Netflix'), isNull);
  });

  test('tutar: boş, geçersiz, sıfır, virgül', () {
    expect(SubscriptionFormValidators.amount(''), 'Tutar gir');
    expect(SubscriptionFormValidators.amount('abc'), 'Geçerli tutar gir');
    expect(SubscriptionFormValidators.amount('0'), 'Geçerli tutar gir');
    expect(SubscriptionFormValidators.amount('-5'), 'Geçerli tutar gir');
    expect(SubscriptionFormValidators.amount('9,99'), isNull);
    expect(SubscriptionFormValidators.amount('10'), isNull);
  });

  test('tutar kuruş hassasiyetini ve canlı API üst sınırını uygular', () {
    expect(SubscriptionLimits.maxAmountMinorUnits,
        subscriptionLimit['maxMinorUnits']);
    expect(SubscriptionFormValidators.amount('1.234'), 'Geçerli tutar gir');
    expect(SubscriptionFormValidators.amount('1e3'), 'Geçerli tutar gir');
    expect(
        SubscriptionFormValidators.amount(subscriptionLimit['max'] as String),
        isNull);
    expect(
        SubscriptionFormValidators.amount(
            subscriptionLimit['overByOneCent'] as String),
        'Tutar çok yüksek');
  });

  test('deneme fiyatı yalnız deneme açıkken doğrulanır', () {
    expect(
      SubscriptionFormValidators.trialPrice('',
          isTrial: false, trialEndDate: null),
      isNull,
    );
    expect(
      SubscriptionFormValidators.trialPrice('5',
          isTrial: true, trialEndDate: null),
      'Deneme bitiş tarihini seç',
    );
    final end = DateTime(2026, 10, 1);
    expect(
      SubscriptionFormValidators.trialPrice('x',
          isTrial: true, trialEndDate: end),
      'Geçerli bir deneme sonrası fiyatı gir',
    );
    expect(
      SubscriptionFormValidators.trialPrice('5,5',
          isTrial: true, trialEndDate: end),
      isNull,
    );
  });
}
