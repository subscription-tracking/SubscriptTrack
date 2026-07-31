enum AppEnvironment { development, staging, production }

abstract final class EnvironmentConfig {
  static const current = AppEnvironment.development;

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

