import 'package:flutter/material.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/settings/presentation/settings_controller.dart';
import '../../features/subscriptions/presentation/screens/subscription_list_screen.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import 'bottom_navigation.dart';
import 'top_bar.dart';

class AppShell extends StatefulWidget {
  const AppShell({
    required this.auth,
    required this.subscriptions,
    required this.settings,
    super.key,
  });

  final AuthController auth;
  final SubscriptionController subscriptions;
  final SettingsController settings;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _titles = [
    'Ana Sayfa',
    'Takvim',
    'Abonelikler',
    'Profil',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: TopBar(title: _titles[_index]),
      body: switch (_index) {
        0 => DashboardScreen(controller: widget.subscriptions),
        1 => CalendarScreen(subscriptions: widget.subscriptions),
        2 => SubscriptionListScreen(controller: widget.subscriptions),
        _ => ProfileTab(
            auth: widget.auth,
            subscriptions: widget.subscriptions,
            settings: widget.settings,
          ),
      },
      bottomNavigationBar: BottomNavigation(
        currentIndex: _index,
        onChanged: (value) => setState(() => _index = value),
      ),
    );
  }
}
