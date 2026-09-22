import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase oturum token'ını [FlutterSecureStorage] üzerinden saklar
/// (Android: EncryptedSharedPreferences, iOS: Keychain). Varsayılan
/// [SharedPreferencesLocalStorage] token'ı düz metin olarak sakladığı için
/// yerine geçer (Test 58).
class SecureSupabaseStorage extends LocalStorage {
  const SecureSupabaseStorage();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _key = 'supabase_session';

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> hasAccessToken() async =>
      (await _storage.read(key: _key)) != null;

  @override
  Future<String?> accessToken() => _storage.read(key: _key);

  @override
  Future<void> removePersistedSession() => _storage.delete(key: _key);

  @override
  Future<void> persistSession(String persistSessionString) =>
      _storage.write(key: _key, value: persistSessionString);
}
