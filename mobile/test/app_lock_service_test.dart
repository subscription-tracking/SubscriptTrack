import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:subscript_track/core/services/app_lock_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

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

  test('existing PIN locks a newly opened app', () async {
    final configured = AppLockService();
    await configured.setPin('1234');

    final reopened = AppLockService();
    await reopened.load();

    expect(reopened.enabled, isTrue);
    expect(reopened.locked, isTrue);
  });
}
