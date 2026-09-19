// ignore_for_file: invalid_use_of_visible_for_testing_member

// Independent acceptance checks for the 2026-09-18 audit.
// Deliberately outside test/: these assert requirements, not current defects.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/services/offline_mutation_queue.dart';
import 'package:subscript_track/core/utils/date_time_utils.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription sub(BillingCycle cycle) => Subscription(
      id: 'audit',
      userId: 'audit-user',
      name: 'Audit subscription',
      amount: Money.parse('100'),
      currency: 'TRY',
      billingCycle: cycle,
      startDate: DateTime(2026, 1, 31),
      nextRenewalDate: DateTime(2026, 1, 31),
      category: SubscriptionCategory.other,
      createdAt: DateTime(2026, 1, 31),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });
  test('S22: weekly 100 TRY must normalize to 433.33 TRY, not 433.00', () {
    expect(sub(BillingCycle.weekly).monthlyAmount.minorUnits, 43333);
  });
  test('S42: January 31 anchor must recover March 31 and April 30', () {
    expect(sub(BillingCycle.monthly).projectedRenewals(count: 4), [
      DateTime(2026, 1, 31),
      DateTime(2026, 2, 28),
      DateTime(2026, 3, 31),
      DateTime(2026, 4, 30),
    ]);
  });
  test('S05: catching up January 31 to March must retain anchor day', () {
    expect(
        DateTimeUtils.nextOccurrenceOnOrAfter(
            DateTime(2026, 1, 31), 'monthly', DateTime(2026, 3, 1)),
        DateTime(2026, 3, 31));
  });
  test('S59: cold load with an existing PIN must start locked', () async {
    final original = AppLockService();
    await original.setPin('1234');
    final reopened = AppLockService();
    await reopened.load();
    expect(reopened.enabled, isTrue);
    expect(reopened.locked, isTrue);
  });
  test('S58: offline financial payload must not be plaintext preferences',
      () async {
    await OfflineMutationQueue().enqueue(OfflineMutation(
      type: 'create',
      payload: sub(BillingCycle.monthly).toJson(),
      enqueuedAt: DateTime.utc(2026, 9, 18),
    ));
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('offline_mutation_queue'),
        isNot(contains('Audit subscription')));
  });
}
