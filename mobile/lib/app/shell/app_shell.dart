import 'package:flutter/material.dart';

import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/subscriptions/presentation/screens/subscription_list_screen.dart';
import 'bottom_navigation.dart';
import 'top_bar.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

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
        0 => const DashboardScreen(),
        1 => const CalendarScreen(),
        2 => const SubscriptionListScreen(),
        _ => const ProfileTab(),
      },
      bottomNavigationBar: BottomNavigation(
        currentIndex: _index,
        onChanged: (value) => setState(() => _index = value),
      ),
    );
  }
}
