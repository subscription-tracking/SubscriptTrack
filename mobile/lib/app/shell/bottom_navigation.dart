import 'package:flutter/material.dart';

class BottomNavigation extends StatelessWidget {
  const BottomNavigation({required this.currentIndex, required this.onChanged, super.key});

  final int currentIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: onChanged,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Ana Sayfa'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), label: 'Takvim'),
          NavigationDestination(icon: Icon(Icons.subscriptions_outlined), label: 'Abonelikler'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      );
}

