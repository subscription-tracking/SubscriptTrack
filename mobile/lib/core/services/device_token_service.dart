import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';

abstract class DeviceTokenService {
  Future<void> registerToken(String userId, ApiClient client);
  Future<void> revokeToken(String userId, ApiClient client);
}

class ApiDeviceTokenService implements DeviceTokenService {
  static const _prefKey = 'device_registration_id';

  @override
  Future<void> registerToken(String userId, ApiClient client) async {
    final pushToken = await _getPushToken();
    // pushToken is null until Firebase is configured — skip silently.
    if (pushToken == null) return;

    try {
      final res = await client.post('/api/v1/notifications/devices', {
        'user_id': userId,
        'token': pushToken,
        'platform': _platform,
      });
      final id = res['id'] as String?;
      if (id != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefKey, id);
      }
    } catch (_) {
      // Best-effort — failure must not block sign-in.
    }
  }

  @override
  Future<void> revokeToken(String userId, ApiClient client) async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_prefKey);
    if (id == null) return;

    try {
      await client.delete('/api/v1/notifications/devices/$id');
      await prefs.remove(_prefKey);
    } catch (_) {
      // Best-effort — failure must not block sign-out.
    }
  }

  /// Returns null until firebase_messaging is added to the project.
  Future<String?> _getPushToken() async => null;

  String get _platform => Platform.isAndroid ? 'android' : 'ios';
}
