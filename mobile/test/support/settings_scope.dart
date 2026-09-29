import 'package:flutter/widgets.dart';
import 'package:provider/provider.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';

/// Ekranları, uygulamadaki gibi [SettingsController] ve
/// [NotificationScheduler] sağlayıcılarıyla sarar.
Widget withSettings(
  Widget child, {
  SettingsController? settings,
  NotificationScheduler? notifications,
}) {
  final resolved = settings ?? SettingsController();
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<SettingsController>.value(value: resolved),
      InheritedProvider<AppPreferences>.value(value: resolved),
      Provider<NotificationScheduler>.value(
        value: notifications ?? NoopNotificationScheduler(),
      ),
    ],
    child: child,
  );
}
