enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  static const _envName = String.fromEnvironment('APP_ENV', defaultValue: '');
  static AppEnvironment get current {
    if (_envName == 'staging') return AppEnvironment.staging;
    if (_envName == 'production') return AppEnvironment.production;
    const isRelease = bool.fromEnvironment('dart.vm.product');
    if (isRelease) return AppEnvironment.production;
    return AppEnvironment.development;
  }

  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Local auth fallback — active whenever Supabase is not configured.
  /// Pass --dart-define=ENABLE_LOCAL_AUTH=false to explicitly disable.
  static const enableLocalAuth =
      bool.fromEnvironment('ENABLE_LOCAL_AUTH', defaultValue: true);
}
