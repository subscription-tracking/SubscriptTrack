import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  SecureStorage._();
  static final SecureStorage instance = SecureStorage._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyCurrentUser = 'current_user';
  static const _keyUserCredentials = 'user_credentials';

  Future<void> writeCurrentUser(String userJson) =>
      _storage.write(key: _keyCurrentUser, value: userJson);

  Future<String?> readCurrentUser() =>
      _storage.read(key: _keyCurrentUser);

  Future<void> deleteCurrentUser() =>
      _storage.delete(key: _keyCurrentUser);

  // Email -> hashed password map, JSON string olarak
  Future<void> writeCredentials(String credJson) =>
      _storage.write(key: _keyUserCredentials, value: credJson);

  Future<String?> readCredentials() =>
      _storage.read(key: _keyUserCredentials);
}
