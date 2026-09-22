import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Abonelik önbelleği — isim, tutar, para birimi ve ödeme yöntemi adı gibi
/// finansal verileri içerir (Test 58). Önceden düz metin `SharedPreferences`
/// kullanılıyordu; artık şifreli depolama (Android: EncryptedSharedPreferences,
/// iOS: Keychain) kullanılıyor — auth kimlik bilgileri için zaten kullanılan
/// [SecureStorage] ile aynı mekanizma.
class LocalStorage {
  LocalStorage._();
  static final LocalStorage instance = LocalStorage._();

  static const _prefixSubscriptions = 'subscriptions_';
  static const _prefixPaymentEvents = 'payment_events_';
  static const _prefixSavingsEvents = 'savings_events_';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // Abonelikler — userId bazlı anahtar
  Future<String?> readSubscriptions(String userId) async {
    final key = '$_prefixSubscriptions$userId';
    var value = await _storage.read(key: key);
    if (value != null) return value;

    // Sürüm yükseltmesinde eski SharedPreferences verisini şifreli depoya
    // taşır. Önce güvenli yazım tamamlanır, ardından eski kopya silinir.
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(key);
    if (legacy == null) return null;
    await _storage.write(key: key, value: legacy);
    await prefs.remove(key);
    return legacy;
  }

  Future<void> writeSubscriptions(String userId, String json) =>
      _storage.write(key: '$_prefixSubscriptions$userId', value: json);

  Future<void> deleteSubscriptions(String userId) =>
      _storage.delete(key: '$_prefixSubscriptions$userId');

  Future<String?> readPaymentEvents(String userId) =>
      _storage.read(key: '$_prefixPaymentEvents$userId');

  Future<void> writePaymentEvents(String userId, String json) =>
      _storage.write(key: '$_prefixPaymentEvents$userId', value: json);

  Future<String?> readSavingsEvents(String userId) =>
      _storage.read(key: '$_prefixSavingsEvents$userId');

  Future<void> writeSavingsEvents(String userId, String json) =>
      _storage.write(key: '$_prefixSavingsEvents$userId', value: json);

  Future<void> deleteFinancialEvents(String userId) => Future.wait([
        _storage.delete(key: '$_prefixPaymentEvents$userId'),
        _storage.delete(key: '$_prefixSavingsEvents$userId'),
      ]);
}
