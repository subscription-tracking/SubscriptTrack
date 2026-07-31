import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  LocalStorage._();
  static final LocalStorage instance = LocalStorage._();

  static const _prefixSubscriptions = 'subscriptions_';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  // Abonelikler — userId bazlı anahtar
  Future<String?> readSubscriptions(String userId) async {
    final prefs = await _prefs;
    return prefs.getString('$_prefixSubscriptions$userId');
  }

  Future<void> writeSubscriptions(String userId, String json) async {
    final prefs = await _prefs;
    await prefs.setString('$_prefixSubscriptions$userId', json);
  }

  Future<void> deleteSubscriptions(String userId) async {
    final prefs = await _prefs;
    await prefs.remove('$_prefixSubscriptions$userId');
  }
}
