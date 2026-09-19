import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  SecureStorage._();
  static final SecureStorage instance = SecureStorage._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyCurrentUser = 'current_user';
  static const _keyUserCredentials = 'user_credentials';
  static const keyAppPinHash = 'app_pin_hash';
  static const keyBiometricLock = 'app_biometric_lock';

  Future<void> writeAppPinHash(String hash) =>
      _storage.write(key: keyAppPinHash, value: hash);

  Future<String?> readAppPinHash() => _storage.read(key: keyAppPinHash);

  Future<void> deleteAppLock() async {
    await _storage.delete(key: keyAppPinHash);
    await _storage.delete(key: keyBiometricLock);
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
