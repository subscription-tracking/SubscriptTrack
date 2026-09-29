import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

final notificationService = LocalNotificationService();

Subscription subscriptionFor(DateTime renewal) => Subscription(
      id: 's14-device',
      userId: 'device-test',
      name: 'S14 device reminder',
      amount: Money.fromJson(31),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(),
      nextRenewalDate: renewal,
      category: SubscriptionCategory.other,
      notificationRules: const [NotificationRule(daysBefore: 0)],
      createdAt: DateTime.now(),
    );

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('S14 tarih değişince Android bekleyen bildirimi yeniler',
      (tester) async {
    await notificationService.initialize();
    await notificationService.cancelAll();
    final first = DateTime.now().add(const Duration(days: 2));
    final second = DateTime.now().add(const Duration(days: 4));
    await notificationService.scheduleRenewalReminders(
      [subscriptionFor(first)],
      0,
    );
    final firstIds = await notificationService.pendingNotificationIds();
    expect(firstIds, isNotEmpty);
    await notificationService.scheduleRenewalReminders(
      [subscriptionFor(second)],
      0,
    );
    final secondIds = await notificationService.pendingNotificationIds();
    expect(secondIds, isNotEmpty);
    expect(secondIds, isNot(equals(firstIds)));
    await notificationService.cancelAll();
  });
}
