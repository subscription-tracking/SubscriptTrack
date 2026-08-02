enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  // Resolved at compile time: pass --dart-define=APP_ENV=production for release builds.
  // Defaults to production in release mode so a missing define is always safe.
  static const _envName = String.fromEnvironment('APP_ENV', defaultValue: '');
  static AppEnvironment get current {
    if (_envName == 'staging') return AppEnvironment.staging;
    if (_envName == 'production') return AppEnvironment.production;
    // kReleaseMode check ensures we never ship a development build accidentally.
    const isRelease = bool.fromEnvironment('dart.vm.product');
    if (isRelease) return AppEnvironment.production;
    return AppEnvironment.development;
  }

  // Secrets are injected with --dart-define and never committed to source.
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Local credential storage is development-only and must be explicitly
  /// enabled. Production builds must use a real auth provider.
  static const enableLocalAuth =
      bool.fromEnvironment('ENABLE_LOCAL_AUTH', defaultValue: false);

  // REST API base URL — override via --dart-define=API_BASE_URL=https://...
  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');
  static bool get isApiConfigured => _apiBaseUrlOverride.isNotEmpty;

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    switch (current) {
      case AppEnvironment.development:
        return 'https://api.dev.subscripttrack.example';
      case AppEnvironment.staging:
        return 'https://api.staging.subscripttrack.example';
      case AppEnvironment.production:
        return 'https://api.subscripttrack.example';
    }
  }
}
