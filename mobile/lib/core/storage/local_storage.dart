import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Abonelik önbelleği — isim, tutar, para birimi ve ödeme yöntemi adı gibi
/// finansal verileri içerir (Test 58). Önceden düz metin `SharedPreferences`
/// kullanılıyordu; artık şifreli depolama (Android: EncryptedSharedPreferences,
/// iOS: Keychain) kullanılıyor — auth kimlik bilgileri için zaten kullanılan
/// [SecureStorage] ile aynı mekanizma.
class LocalStorage {
  LocalStorage._();
  static final LocalStorage instance = LocalStorage._();

  static const _prefixSubscriptions = 'subscriptions_';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // Abonelikler — userId bazlı anahtar
  Future<String?> readSubscriptions(String userId) =>
      _storage.read(key: '$_prefixSubscriptions$userId');

  Future<void> writeSubscriptions(String userId, String json) =>
      _storage.write(key: '$_prefixSubscriptions$userId', value: json);

  Future<void> deleteSubscriptions(String userId) =>
      _storage.delete(key: '$_prefixSubscriptions$userId');
}
