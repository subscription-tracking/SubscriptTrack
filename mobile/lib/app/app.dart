import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/services/notification_scheduler.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/settings/presentation/settings_controller.dart';
import '../core/preferences/app_preferences.dart';
import '../core/services/app_lock_gate.dart';
import '../core/services/app_lock_service.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class SubscriptTrackApp extends StatefulWidget {
  const SubscriptTrackApp({this.notifications, super.key});

  /// Yerel bildirim uygulaması; verilmezse bildirimler devre dışıdır.
  final NotificationScheduler? notifications;

  @override
  State<SubscriptTrackApp> createState() => _SubscriptTrackAppState();
}

class _SubscriptTrackAppState extends State<SubscriptTrackApp> {
  late final AuthController _auth;
  late final _router = AppRouter.create(_auth);
  late final SettingsController _settings;
  late final AppLockService _lock;
  late final NotificationScheduler _notifications;

  @override
  void initState() {
    super.initState();
    _settings = SettingsController();
    _lock = AppLockService();
    _notifications = widget.notifications ?? NoopNotificationScheduler();
    _auth = AuthController(settings: _settings);
    _settings.load();
    _auth.init();
  }

  @override
  void dispose() {
    _auth.dispose();
    _settings.dispose();
    _lock.dispose();
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: _auth),
        ChangeNotifierProvider<SettingsController>.value(value: _settings),
        InheritedProvider<AppPreferences>.value(value: _settings),
        ChangeNotifierProvider<AppLockService>.value(value: _lock),
        Provider<NotificationScheduler>.value(value: _notifications),
      ],
      child: ListenableBuilder(
        listenable: _settings,
        // AppLockGate bir Stack kuruyor; Stack'in varsayılan
        // AlignmentDirectional.topStart'ı bir Directionality atası
        // gerektiriyor. MaterialApp'ın DIŞINA konursa (child: MaterialApp)
        // bu ata hiç sağlanmıyordu — builder: içine alınca MaterialApp'ın
        // kendi Directionality/Localizations kapsamının İÇİNDE kalıyor.
        builder: (_, __) => MaterialApp.router(
          title: 'SubscriptTrack',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.dark,
          routerConfig: _router,
          builder: (context, child) => AppLockGate(
            service: _lock,
            child: child ?? const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}
