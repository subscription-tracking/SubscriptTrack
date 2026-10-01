import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  SecureStorage._();
  static final SecureStorage instance = SecureStorage._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
  );

  static const _keyCurrentUser = 'current_user';
  static const _keyUserCredentials = 'user_credentials';
  static const keyAppPinHash = 'app_pin_hash';
  static const keyBiometricLock = 'app_biometric_lock';
  static const keyLockTimeoutMinutes = 'app_lock_timeout_minutes';
  static const keyPinAttempts = 'app_pin_attempts';

  Future<void> writeAppPinHash(String hash) =>
      _storage.write(key: keyAppPinHash, value: hash);

  Future<String?> readAppPinHash() => _storage.read(key: keyAppPinHash);

  Future<void> deleteAppLock() async {
    await _storage.delete(key: keyAppPinHash);
    await _storage.delete(key: keyBiometricLock);
    await _storage.delete(key: keyLockTimeoutMinutes);
    await clearPinAttempts();
  }

  /// PIN deneme sayacı: `<başarısız>|<kilit bitişi (UTC epoch ms)>`.
  Future<void> writePinAttempts(int failed, DateTime? lockedUntil) =>
      _storage.write(
        key: keyPinAttempts,
        value: '$failed|${lockedUntil?.toUtc().millisecondsSinceEpoch ?? 0}',
      );

  Future<({int failed, DateTime? lockedUntil})> readPinAttempts() async {
    final raw = await _storage.read(key: keyPinAttempts);
    final parts = (raw ?? '').split('|');
    if (parts.length != 2) return (failed: 0, lockedUntil: null);
    final failed = int.tryParse(parts[0]) ?? 0;
    final ms = int.tryParse(parts[1]) ?? 0;
    return (
      failed: failed < 0 ? 0 : failed,
      lockedUntil:
          ms > 0 ? DateTime.fromMillisecondsSinceEpoch(ms, isUtc: true) : null,
    );
  }

  Future<void> clearPinAttempts() => _storage.delete(key: keyPinAttempts);

  Future<void> writeLockTimeoutMinutes(int minutes) =>
      _storage.write(key: keyLockTimeoutMinutes, value: minutes.toString());

  Future<int> readLockTimeoutMinutes() async {
    final raw = await _storage.read(key: keyLockTimeoutMinutes);
    // Yeni PIN kurulumlarında kısa uygulama geçişlerinde kilitlenmemesi için
    // güvenli varsayılan beş dakikadır. Kullanıcı "Hemen" seçerse değer 0
    // olarak açıkça saklanır ve korunur.
    return raw == null ? 5 : (int.tryParse(raw) ?? 5);
  }

  Future<void> writeBiometricLock(bool enabled) => _storage.write(
        key: keyBiometricLock,
        value: enabled ? 'true' : 'false',
      );

  Future<bool> readBiometricLock() async =>
      (await _storage.read(key: keyBiometricLock)) == 'true';

  Future<void> writeCurrentUser(String userJson) =>
      _storage.write(key: _keyCurrentUser, value: userJson);

  Future<String?> readCurrentUser() => _storage.read(key: _keyCurrentUser);

  Future<void> deleteCurrentUser() => _storage.delete(key: _keyCurrentUser);

  // Email -> hashed password map, JSON string olarak
  Future<void> writeCredentials(String credJson) =>
      _storage.write(key: _keyUserCredentials, value: credJson);

  Future<String?> readCredentials() => _storage.read(key: _keyUserCredentials);

  Future<void> deleteCredentialsForEmail(String email) async {
    final raw = await readCredentials();
    if (raw == null) return;
    final decoded = Map<String, dynamic>.from(
      jsonDecode(raw) as Map,
    );
    decoded.remove(email);
    await writeCredentials(jsonEncode(decoded));
  }

  Future<void> deleteAllUserData() => _storage.deleteAll();
}
