enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  static const current = AppEnvironment.development;

  // ─── Supabase ────────────────────────────────────────────────
  // Keyleri buraya yapıştır — bu iki satır dolunca her şey otomatik devreye girer.
  static const supabaseUrl = 'https://tdbljrojcmyjwchawfif.supabase.co';
  static const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmxqcm9qY215andjaGF3ZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDIzMTksImV4cCI6MjEwMTA3ODMxOX0.66FcXj8rrmE_zMfQ4n2h0HZpdYVznYzguB8AW6Zqq6I';

  static const bool isSupabaseConfigured = true;
  // ─────────────────────────────────────────────────────────────

  // ─── Firebase (Sprint 6) ─────────────────────────────────────
  // FlutterFire CLI çalıştırıldıktan sonra true yap.
  static const bool isFirebaseConfigured = false;
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
