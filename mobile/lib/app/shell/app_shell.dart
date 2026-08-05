import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/calendar/presentation/screens/calendar_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/subscriptions/presentation/screens/subscription_list_screen.dart';
import '../../features/subscriptions/presentation/screens/add_subscription_screen.dart';
import '../../features/subscriptions/presentation/subscription_controller.dart';
import 'bottom_navigation.dart';
import 'top_bar.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      appBar: const TopBar(),
      body: switch (_index) {
        0 => DashboardScreen(
            onViewAllSubscriptions: () => setState(() => _index = 1),
          ),
        1 => const SubscriptionListScreen(),
        2 => const CalendarScreen(),
        _ => const ProfileTab(),
      },
      bottomNavigationBar: BottomNavigation(
        currentIndex: _index,
        onChanged: (v) => setState(() => _index = v),
      ),
      floatingActionButton: _index == 1
          ? Semantics(
              label: 'Yeni abonelik ekle',
              button: true,
              child: FloatingActionButton.extended(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => AddSubscriptionScreen(
                      controller: context.read<SubscriptionController>(),
                    ),
                  ),
                ),
                icon: const Icon(Icons.add),
                label: const Text('Abonelik ekle'),
              ),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}
