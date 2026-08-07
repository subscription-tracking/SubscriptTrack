import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_environment.dart';

abstract class DeviceTokenService {
  Future<void> registerToken(String userId);
  Future<void> revokeToken(String userId);
}

class SupabaseDeviceTokenService implements DeviceTokenService {
  static const _prefKey = 'device_registration_id';

  SupabaseClient? get _client =>
      EnvironmentConfig.isSupabaseConfigured ? Supabase.instance.client : null;

  @override
  Future<void> registerToken(String userId) async {
    final pushToken = await _getPushToken();
    if (pushToken == null) return;

    final client = _client;
    if (client == null) return;
    try {
      final row = await client
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

    final client = _client;
    if (client == null) return;
    try {
      await client
          .from('device_tokens')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      await prefs.remove(_prefKey);
    } catch (_) {
      // Best-effort — failure must not block sign-out.
    }
  }

  /// Push token acquisition is not yet implemented.
  /// flutter_local_notifications handles all user-visible reminders instead.
  Future<String?> _getPushToken() async => null;
}
