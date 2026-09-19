import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';

Subscription _subscription({
  String name = 'Netflix',
  int minorUnits = 19999,
  List<NotificationRule> rules = const [NotificationRule(daysBefore: 3)],
}) =>
    Subscription(
      id: 'sub-1',
      userId: 'user-1',
      name: name,
      category: SubscriptionCategory.streaming,
      amount: Money.parse(
        '${minorUnits ~/ 100}.${(minorUnits % 100).toString().padLeft(2, '0')}',
      ),
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.utc(2026, 1, 31),
      nextRenewalDate: DateTime.utc(2026, 2, 28),
      currency: 'TRY',
      notificationRules: rules,
      createdAt: DateTime.utc(2026, 1, 1),
    );

void main() {
  test('bildirim parmak izi içerik veya kural değişince değişir', () {
    final base = LocalNotificationService.scheduleFingerprint(
      [_subscription()],
      3,
      timezone: 'Europe/Istanbul',
    );

    expect(
      LocalNotificationService.scheduleFingerprint(
        [_subscription(name: 'Netflix Premium')],
        3,
        timezone: 'Europe/Istanbul',
      ),
      isNot(base),
    );
    expect(
      LocalNotificationService.scheduleFingerprint(
        [_subscription(minorUnits: 24999)],
        3,
        timezone: 'Europe/Istanbul',
      ),
      isNot(base),
    );
    expect(
      LocalNotificationService.scheduleFingerprint(
        [
          _subscription(
            rules: const [NotificationRule(daysBefore: 7)],
          ),
        ],
        3,
        timezone: 'Europe/Istanbul',
      ),
      isNot(base),
    );
  });

  test('snooze işletim sistemi için ayrılan bildirim sınırını aşmaz', () {
    expect(
      LocalNotificationService.canScheduleAdditionalNotification(
        LocalNotificationService.maxScheduledNotifications - 1,
      ),
      isTrue,
    );
    expect(
      LocalNotificationService.canScheduleAdditionalNotification(
        LocalNotificationService.maxScheduledNotifications,
      ),
      isFalse,
    );
  });
}
