enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  static const current = AppEnvironment.development;

  // ─── Supabase ────────────────────────────────────────────────
  // Keyleri buraya yapıştır — bu iki satır dolunca her şey otomatik devreye girer.
  static const supabaseUrl = 'YOUR_SUPABASE_URL';
  static const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  static bool get isSupabaseConfigured =>
      supabaseUrl != 'YOUR_SUPABASE_URL' &&
      supabaseAnonKey != 'YOUR_SUPABASE_ANON_KEY';
  // ─────────────────────────────────────────────────────────────

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
