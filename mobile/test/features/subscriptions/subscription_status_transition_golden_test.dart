import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_enums.dart';

void main() {
  final fixture = jsonDecode(
    File('../testdata/flutter_expo_domain_goldens.json').readAsStringSync(),
  ) as Map<String, dynamic>;
  final statuses = (fixture['statuses'] as List<dynamic>).cast<String>();
  final allowed = (fixture['allowedTransitions'] as Map<String, dynamic>).map(
    (key, value) => MapEntry(key, (value as List<dynamic>).cast<String>()),
  );

  group('Ortak Flutter–Expo abonelik geçişleri', () {
    for (final from in statuses) {
      for (final to in statuses) {
        test('$from → $to', () {
          final actual = SubscriptionStatus.values.byName(from).canTransitionTo(
                SubscriptionStatus.values.byName(to),
              );
          expect(actual, allowed[from]!.contains(to));
        });
      }
    }
  });
}
