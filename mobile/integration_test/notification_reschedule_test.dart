import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription subscriptionFor(DateTime renewal) => Subscription(
      id: 's14-device', userId: 'device-test', name: 'S14 device reminder',
      amount: Money.fromJson(31), currency: 'TRY', billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(), nextRenewalDate: renewal,
      category: SubscriptionCategory.other,
      notificationRules: const [NotificationRule(daysBefore: 0)],
      createdAt: DateTime.now(),
    );

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('S14 tarih değişince Android bekleyen bildirimi yeniler', (tester) async {
    await LocalNotificationService.initialize();
    await LocalNotificationService.cancelAll();
    final first = DateTime.now().add(const Duration(days: 2));
    final second = DateTime.now().add(const Duration(days: 4));
    await LocalNotificationService.scheduleRenewalReminders(
      [subscriptionFor(first)], 0,
    );
    final firstIds = await LocalNotificationService.pendingNotificationIds();
    expect(firstIds, isNotEmpty);
    await LocalNotificationService.scheduleRenewalReminders(
      [subscriptionFor(second)], 0,
    );
    final secondIds = await LocalNotificationService.pendingNotificationIds();
    expect(secondIds, isNotEmpty);
    expect(secondIds, isNot(equals(firstIds)));
    await LocalNotificationService.cancelAll();
  });
}
