import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/services/app_lock_service.dart';

void main() {
  test('PIN must be numeric and 4-8 digits', () async {
    final lock = AppLockService();
    expect(() => lock.setPin('123'), throwsFormatException);
    expect(() => lock.setPin('123456789'), throwsFormatException);
    expect(() => lock.setPin('12a4'), throwsFormatException);
  });

  test('lock remains disabled until a PIN is configured', () {
    final lock = AppLockService();
    lock.lock();
    expect(lock.enabled, isFalse);
    expect(lock.locked, isFalse);
  });
}
