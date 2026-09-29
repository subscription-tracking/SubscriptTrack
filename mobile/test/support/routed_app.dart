import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import 'package:subscript_track/app/router/app_router.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';

/// [home]'u, üretimdeki gibi gerçek `AppRouter` rotalarıyla çalışan bir
/// `MaterialApp.router` içinde gösterir.
///
/// [providers], üretimde `AuthenticatedShell`'in sağladığı controller'ları
/// temsil eder: ekranlar bunları rota içinden `context.read` ile okuyabilmeli,
/// bu yüzden router'ın ÜSTÜNDE değil, rota ağacının atası olarak verilir.
Widget routedApp({
  required Widget home,
  List<SingleChildWidget> providers = const [],
  SettingsController? settings,
  NotificationScheduler? notifications,
  ThemeData? theme,
}) {
  final resolved = settings ?? SettingsController();
  final router = GoRouter(
    initialLocation: '/test-home',
    routes: [
      GoRoute(path: '/test-home', builder: (_, __) => home),
      ...AppRouter.legalRoutes(),
      ...AppRouter.contentRoutes(),
    ],
  );
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<SettingsController>.value(value: resolved),
      InheritedProvider<AppPreferences>.value(value: resolved),
      Provider<NotificationScheduler>.value(
        value: notifications ?? NoopNotificationScheduler(),
      ),
      ...providers,
    ],
    child: MaterialApp.router(routerConfig: router, theme: theme),
  );
}
