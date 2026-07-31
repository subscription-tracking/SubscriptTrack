import 'package:flutter/material.dart';

import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../features/settings/presentation/settings_controller.dart';
import '../features/subscriptions/presentation/subscription_controller.dart';
import 'shell/app_shell.dart';
import 'splash_screen.dart';
import 'theme/app_theme.dart';

class SubscriptTrackApp extends StatefulWidget {
  const SubscriptTrackApp({super.key});

  @override
  State<SubscriptTrackApp> createState() => _SubscriptTrackAppState();
}

class _SubscriptTrackAppState extends State<SubscriptTrackApp> {
  final _auth = AuthController();
  final _settings = SettingsController.instance;

  // Her ikisi de hazır olana kadar splash göster — flash yok.
  bool _ready = false;
  bool _showOnboarding = false;

  @override
  void initState() {
    super.initState();
    _settings.load();
    _initialize();
  }

  Future<void> _initialize() async {
    // Auth ve onboarding kontrolünü paralel başlat, her ikisi bitince devam et.
    final results = await Future.wait<dynamic>([
      _auth.init(),
      OnboardingScreen.shouldShow(),
    ]);
    if (!mounted) return;
    setState(() {
      _showOnboarding = results[1] as bool;
      _ready = true;
    });
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _settings,
      builder: (context, _) => MaterialApp(
        title: 'SubscriptTrack',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: _settings.themeMode,
        home: !_ready
            ? const SplashScreen()
            : _showOnboarding
                ? OnboardingScreen(
                    onDone: () => setState(() => _showOnboarding = false),
                  )
                : ListenableBuilder(
                    listenable: _auth,
                    builder: (context, _) => switch (_auth.status) {
                      AuthStatus.unknown => const SplashScreen(),
                      AuthStatus.authenticated =>
                        _AuthenticatedShell(auth: _auth, settings: _settings),
                      AuthStatus.unauthenticated => _AuthFlow(auth: _auth),
                    },
                  ),
      ),
    );
  }
}

class _AuthenticatedShell extends StatefulWidget {
  const _AuthenticatedShell({required this.auth, required this.settings});

  final AuthController auth;
  final SettingsController settings;

  @override
  State<_AuthenticatedShell> createState() => _AuthenticatedShellState();
}

class _AuthenticatedShellState extends State<_AuthenticatedShell> {
  late final SubscriptionController _subs;

  @override
  void initState() {
    super.initState();
    _subs = SubscriptionController(userId: widget.auth.user!.id);
    _subs.load();
  }

  @override
  void dispose() {
    _subs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppShell(
        auth: widget.auth,
        subscriptions: _subs,
        settings: widget.settings,
      );
}

class _AuthFlow extends StatefulWidget {
  const _AuthFlow({required this.auth});

  final AuthController auth;

  @override
  State<_AuthFlow> createState() => _AuthFlowState();
}

class _AuthFlowState extends State<_AuthFlow> {
  bool _showRegister = false;

  @override
  Widget build(BuildContext context) => _showRegister
      ? RegisterScreen(
          controller: widget.auth,
          onLoginTap: () => setState(() => _showRegister = false),
        )
      : LoginScreen(
          controller: widget.auth,
          onRegisterTap: () => setState(() => _showRegister = true),
        );
}
