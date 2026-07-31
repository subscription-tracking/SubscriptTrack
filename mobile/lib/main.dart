import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/config/app_environment.dart';
import 'core/services/local_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (EnvironmentConfig.isSupabaseConfigured) {
    await Supabase.initialize(
      url: EnvironmentConfig.supabaseUrl,
      publishableKey: EnvironmentConfig.supabaseAnonKey,
    );
  }

  await LocalNotificationService.initialize();

  runApp(const SubscriptTrackApp());
}
