import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

abstract class DeviceTokenService {
  Future<void> registerToken(String userId);
  Future<void> revokeToken(String userId);
}

class SupabaseDeviceTokenService implements DeviceTokenService {
  static const _prefKey = 'device_registration_id';

  SupabaseClient get _client => Supabase.instance.client;

  @override
  Future<void> registerToken(String userId) async {
    final pushToken = await _getPushToken();
    // pushToken is null until firebase_messaging is added — skip silently.
    if (pushToken == null) return;

    try {
      final row = await _client
          .from('device_tokens')
          .upsert(
            {
              'user_id': userId,
              'token': pushToken,
              'platform': defaultTargetPlatform == TargetPlatform.android ? 'android' : 'ios',
            },
            onConflict: 'user_id,token',
          )
          .select()
          .single();
      final id = row['id'] as String?;
      if (id != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_prefKey, id);
      }
    } catch (_) {
      // Best-effort — failure must not block sign-in.
    }
  }

  @override
  Future<void> revokeToken(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_prefKey);
    if (id == null) return;

    try {
      await _client
          .from('device_tokens')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      await prefs.remove(_prefKey);
    } catch (_) {
      // Best-effort — failure must not block sign-out.
    }
  }

  /// Returns null until firebase_messaging is added to the project.
  Future<String?> _getPushToken() async => null;
}
