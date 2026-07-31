enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  static const current = AppEnvironment.development;

  // Secrets are injected with --dart-define and never committed to source.
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
  static const isFirebaseConfigured = false;

  static String get apiBaseUrl {
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
