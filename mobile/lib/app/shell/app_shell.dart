import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../features/auth/presentation/auth_controller.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/stats/presentation/screens/stats_screen.dart';
import '../../features/subscriptions/presentation/screens/subscription_list_screen.dart';
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

  static const _months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  static const _days = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

  @override
  Widget build(BuildContext context) {
    final subscriptions = context.watch<SubscriptionController>();
    final user = context.watch<AuthController>().user;

    return Scaffold(
      extendBody: true,
      appBar: _topBarFor(_index, subscriptions, user),
      body: switch (_index) {
        0 => DashboardScreen(
            onViewAllSubscriptions: () => setState(() => _index = 1),
          ),
        1 => const SubscriptionListScreen(),
        2 => StatsScreen(controller: subscriptions, embedded: true),
        _ => const ProfileTab(),
      },
      bottomNavigationBar: BottomNavigation(
        currentIndex: _index,
        onChanged: (v) => setState(() => _index = v),
      ),
    );
  }

  PreferredSizeWidget _topBarFor(
    int index,
    SubscriptionController subscriptions,
    AppUser? user,
  ) {
    switch (index) {
      case 0:
        final now = DateTime.now();
        final date = '${_days[now.weekday % 7]}, ${now.day} '
            '${_months[now.month - 1]}';
        final name = user?.displayName?.trim().isNotEmpty == true
            ? user!.displayName!.trim()
            : user?.email.split('@').first;
        final greeting =
            name?.isNotEmpty == true ? 'Merhaba, $name' : 'Merhaba';
        return TopBar(
          icon: Icons.bolt_rounded,
          subtitle: date,
          title: greeting,
        );
      case 1:
        return TopBar(
          icon: Icons.grid_view_rounded,
          subtitle: '${subscriptions.active.length} aktif abonelik',
          title: 'Abonelikler',
        );
      case 2:
        return const TopBar(
          icon: Icons.bar_chart_rounded,
          title: 'İstatistikler',
        );
      default:
        return const TopBar(
          icon: Icons.person_rounded,
          title: 'Profil',
        );
    }
  }
}
