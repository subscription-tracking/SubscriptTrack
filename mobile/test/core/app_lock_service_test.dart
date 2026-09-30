import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/storage/secure_storage.dart';

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

  group('S45 — kilit süresi (lockTimeout)', () {
    test('varsayılan süre sıfırdır ve diskten geri yüklenir', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.setLockTimeout(const Duration(minutes: 5));

      final reopened = AppLockService();
      await reopened.load();

      expect(reopened.lockTimeout, const Duration(minutes: 5));
    });

    test('süre sıfırken arka plana geçince anında kilitlenir', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.verifyPin('1234');
      expect(lock.locked, isFalse);

      lock.handleBackground();

      expect(lock.locked, isTrue,
          reason: 'varsayılan davranış (süre 0) değişmemeli');
    });

    test(
        'süre tanımlıyken arka plana geçince anında kilitlenmez, '
        'süre dolmadan öne dönülürse kilitlenmez', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.verifyPin('1234');
      await lock.setLockTimeout(const Duration(milliseconds: 200));

      lock.handleBackground();
      expect(lock.locked, isFalse,
          reason: 'süre tanımlıyken arka plana geçiş anında kilitlemez');

      lock.handleResume();
      expect(lock.locked, isFalse,
          reason: 'süre dolmadan öne dönüldüğünde kilitlenmemeli');
    });

    test('süre dolduktan sonra öne dönülürse kilitlenir', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.verifyPin('1234');
      await lock.setLockTimeout(const Duration(milliseconds: 50));

      lock.handleBackground();
      await Future<void>.delayed(const Duration(milliseconds: 80));
      lock.handleResume();

      expect(lock.locked, isTrue,
          reason: 'süre dolduktan sonra öne dönülünce kilitlenmeli');
    });

    test('disable() kilit süresini de sıfırlar', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.setLockTimeout(const Duration(minutes: 1));

      await lock.disable();

      expect(lock.lockTimeout, Duration.zero);
    });
  });
  group('disable() — kilidi tamamen kapatır', () {
    test('PIN, kilit ve biyometri kapanır, yeniden açılışta da kapalı kalır', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      // Test ortamında biyometri donanımı yok; durumu depolama üzerinden kur.
      await SecureStorage.instance.writeBiometricLock(true);
      await lock.load();
      lock.lock();
      expect(lock.enabled, isTrue);
      expect(lock.locked, isTrue);
      expect(lock.biometricEnabled, isTrue);

      await lock.disable();

      expect(lock.enabled, isFalse, reason: 'devre dışı bırakılınca kilit etkin kalmamalı');
      expect(lock.locked, isFalse);
      expect(lock.biometricEnabled, isFalse);
      expect(lock.loaded, isTrue);

      final reopened = AppLockService();
      await reopened.load();
      expect(reopened.enabled, isFalse, reason: 'PIN diskten de silinmeli');
      expect(reopened.locked, isFalse);
      expect(reopened.biometricEnabled, isFalse);
    });

    test('devre dışı bırakıldıktan sonra lock() ve arka plan kilitlemesi etkisizdir', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.disable();

      lock.lock();
      lock.handleBackground();
      lock.handleResume();

      expect(lock.locked, isFalse);
    });

    test('devre dışı bırakıldıktan sonra eski PIN doğrulanmaz', () async {
      final lock = AppLockService();
      await lock.setPin('1234');
      await lock.disable();

      expect(await lock.verifyPin('1234'), isFalse);
    });
  });
}
