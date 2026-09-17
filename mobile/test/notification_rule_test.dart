import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';

void main() {
  test('notification rule JSON round-trip preserves offset and enabled state',
      () {
    const rule = NotificationRule(daysBefore: 7, enabled: false);
    expect(NotificationRule.fromJson(rule.toJson()).daysBefore, 7);
    expect(NotificationRule.fromJson(rule.toJson()).enabled, isFalse);
  });

  test('notification rule supports the allowed 0–30 day range', () {
    expect(const NotificationRule(daysBefore: 0).daysBefore, 0);
    expect(const NotificationRule(daysBefore: 30).daysBefore, 30);
  });
}
