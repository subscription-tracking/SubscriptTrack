import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';

final notificationService = LocalNotificationService();

void main() {
  test('cancelForSubscription is safe before plugin initialization', () async {
    await notificationService.cancelForSubscription('sub-1');
    await notificationService.cancelForSubscription('');
  });

  test('snooze keeps a stable public default duration', () {
    expect(
        LocalNotificationService.snoozeDuration, const Duration(minutes: 30));
  });
}
