import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../features/auth/presentation/auth_controller.dart';
import '../features/settings/presentation/settings_controller.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class SubscriptTrackApp extends StatefulWidget {
  const SubscriptTrackApp({super.key});

  @override
  State<SubscriptTrackApp> createState() => _SubscriptTrackAppState();
}

class _SubscriptTrackAppState extends State<SubscriptTrackApp> {
  late final AuthController _auth;
  late final _router = AppRouter.create(_auth);
  final _settings = SettingsController.instance;

  @override
  void initState() {
    super.initState();
    _auth = AuthController();
    _settings.load();
    _auth.init();
  }

  @override
  void dispose() {
    _auth.dispose();
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: _auth),
        ChangeNotifierProvider<SettingsController>.value(value: _settings),
      ],
      child: ListenableBuilder(
        listenable: _settings,
        builder: (_, __) => MaterialApp.router(
          title: 'SubscriptTrack',
          debugShowCheckedModeBanner: false,
          // Açık tema geçici olarak kapalı; ürün şu aşamada yalnızca koyu tema
          // ile çalışır.
          theme: AppTheme.dark,
          darkTheme: AppTheme.dark,
          themeMode: ThemeMode.dark,
          routerConfig: _router,
        ),
      ),
    );
  }
}
