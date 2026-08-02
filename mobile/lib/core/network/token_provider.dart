import 'package:supabase_flutter/supabase_flutter.dart';

abstract class TokenProvider {
  Future<String?> getToken();
}

class SupabaseTokenProvider implements TokenProvider {
  @override
  Future<String?> getToken() async =>
      Supabase.instance.client.auth.currentSession?.accessToken;
}

/// Test ve geliştirme ortamı için sabit token.
class StaticTokenProvider implements TokenProvider {
  const StaticTokenProvider(this._token);
  final String _token;

  @override
  Future<String?> getToken() async => _token;
}
