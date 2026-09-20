import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'core/config/app_environment.dart';
import 'core/services/local_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Geçici: release modunda varsayılan boş/gri hata kutusu yerine gerçek
  // hata mesajını göster — bir ekranın neden "bozuk" göründüğünü
  // teşhis etmek için. Teşhis bitince kaldırılacak.
  ErrorWidget.builder = (details) => Container(
        color: Colors.red.shade50,
        padding: const EdgeInsets.all(16),
        alignment: Alignment.topLeft,
        child: SingleChildScrollView(
          child: Text(
            details.exceptionAsString(),
            style: const TextStyle(color: Colors.red, fontSize: 12),
          ),
        ),
      );

  if (EnvironmentConfig.isSupabaseConfigured) {
    await Supabase.initialize(
      url: EnvironmentConfig.supabaseUrl,
      publishableKey: EnvironmentConfig.supabaseAnonKey,
    );
  }

  if (!kIsWeb) {
    await LocalNotificationService.initialize();
  }

  runApp(const SubscriptTrackApp());
}
