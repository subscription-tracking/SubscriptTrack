import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/services/pin_hasher.dart';
import 'package:subscript_track/core/storage/secure_storage.dart';

/// Denetim F-04: salt'lı PBKDF2, üstel bekleme, saat geri alma.
void main() {
  late DateTime now;
  late AppLockService service;

  AppLockService make() => AppLockService(
        hasher: const InlinePinHasher(iterations: 500),
        clock: () => now,
      );

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    now = DateTime.utc(2026, 10, 1, 12);
    service = make();
  });

  test('bekleme çizelgesi: 5 hatadan sonra 30 sn, ikiye katlanır, 15 dk sınır',
      () {
    expect(AppLockService.lockoutFor(4), Duration.zero);
    expect(AppLockService.lockoutFor(5), const Duration(seconds: 30));
    expect(AppLockService.lockoutFor(6), const Duration(minutes: 1));
    expect(AppLockService.lockoutFor(7), const Duration(minutes: 2));
    expect(AppLockService.lockoutFor(8), const Duration(minutes: 4));
    expect(AppLockService.lockoutFor(9), const Duration(minutes: 8));
    expect(AppLockService.lockoutFor(10), const Duration(minutes: 15));
    expect(AppLockService.lockoutFor(500), const Duration(minutes: 15));
  });

  test('PIN depoda v2 (salt\'lı PBKDF2) olarak saklanır, düz SHA-256 değil',
      () async {
    await service.setPin('1234');
    final stored = await SecureStorage.instance.readAppPinHash();
    expect(stored, startsWith('v2:'));
    expect(stored, isNot(sha256.convert(utf8.encode('1234')).toString()));
  });

  test('5 yanlış denemeden sonra doğru PIN bile bekleme bitene dek reddedilir',
      () async {
    await service.setPin('1234');
    service.lock();
    for (var i = 0; i < 4; i++) {
      expect(await service.verifyPin('0000'), isFalse);
      expect(service.isLockedOut, isFalse);
    }
    expect(await service.verifyPin('0000'), isFalse);
    expect(service.isLockedOut, isTrue);
    expect(service.lockoutRemaining, const Duration(seconds: 30));

    expect(await service.verifyPin('1234'), isFalse,
        reason: 'bekleme sürerken doğru PIN de denenmez');
    expect(service.locked, isTrue);
    expect(service.failedAttempts, 5, reason: 'bekleme içi çağrı sayılmaz');

    now = now.add(const Duration(seconds: 31));
    expect(service.isLockedOut, isFalse);
    expect(await service.verifyPin('1234'), isTrue);
    expect(service.locked, isFalse);
    expect(service.failedAttempts, 0);
  });

  test('bekleme süresi her hatada uzar', () async {
    await service.setPin('1234');
    for (var i = 0; i < 5; i++) {
      await service.verifyPin('0000');
    }
    now = now.add(const Duration(seconds: 31));
    await service.verifyPin('0000'); // 6. hata
    expect(service.lockoutRemaining, const Duration(minutes: 1));
  });

  test('sayaç kalıcıdır: uygulama yeniden başlayınca bekleme sürer', () async {
    await service.setPin('1234');
    for (var i = 0; i < 5; i++) {
      await service.verifyPin('0000');
    }
    final restarted = make();
    await restarted.load();
    expect(restarted.failedAttempts, 5);
    expect(restarted.isLockedOut, isTrue);
    expect(await restarted.verifyPin('1234'), isFalse);
  });

  test('başarılı giriş sayacı sıfırlar', () async {
    await service.setPin('1234');
    await service.verifyPin('0000');
    await service.verifyPin('0000');
    expect(service.failedAttempts, 2);
    expect(await service.verifyPin('1234'), isTrue);
    expect(service.failedAttempts, 0);
    expect((await SecureStorage.instance.readPinAttempts()).failed, 0);
  });

  test('yeni PIN kurmak ve kilidi kapatmak sayacı sıfırlar', () async {
    await service.setPin('1234');
    for (var i = 0; i < 5; i++) {
      await service.verifyPin('0000');
    }
    await service.setPin('5678');
    expect(service.isLockedOut, isFalse);

    for (var i = 0; i < 5; i++) {
      await service.verifyPin('0000');
    }
    await service.disable();
    expect(service.failedAttempts, 0);
    expect((await SecureStorage.instance.readPinAttempts()).failed, 0);
  });

  test('eski SHA-256 özeti doğrulanır ve v2\'ye yükseltilir', () async {
    final legacy = sha256.convert(utf8.encode('4321')).toString();
    await SecureStorage.instance.writeAppPinHash(legacy);
    await service.load();
    expect(service.enabled, isTrue);

    expect(await service.verifyPin('0000'), isFalse);
    expect(await SecureStorage.instance.readAppPinHash(), legacy);

    expect(await service.verifyPin('4321'), isTrue);
    final upgraded = await SecureStorage.instance.readAppPinHash();
    expect(upgraded, startsWith('v2:'));

    service.lock();
    expect(await service.verifyPin('4321'), isTrue,
        reason: 'yükseltilmiş özet de doğrulanır');
  });

  test('saklanan bitiş gelecekte aşırı uzaksa bekleme 15 dk ile sınırlanır',
      () async {
    await service.setPin('1234');
    await SecureStorage.instance
        .writePinAttempts(6, now.add(const Duration(days: 365)));
    final s = make();
    await s.load();
    expect(s.lockoutRemaining, const Duration(minutes: 15));
  });

  group('saat geri alma', () {
    test('süre ayarlıyken saat geri alınırsa anında kilitler', () async {
      await service.setPin('1234');
      await service.setLockTimeout(const Duration(minutes: 5));
      expect(await service.verifyPin('1234'), isTrue);

      service.handleBackground();
      now = now.subtract(const Duration(hours: 2));
      service.handleResume();
      expect(service.locked, isTrue);
    });

    test('süre dolmadan dönüşte kilitlenmez, dolunca kilitlenir', () async {
      await service.setPin('1234');
      await service.setLockTimeout(const Duration(minutes: 5));

      service.handleBackground();
      now = now.add(const Duration(minutes: 1));
      service.handleResume();
      expect(service.locked, isFalse);

      service.handleBackground();
      now = now.add(const Duration(minutes: 6));
      service.handleResume();
      expect(service.locked, isTrue);
    });
  });
}
