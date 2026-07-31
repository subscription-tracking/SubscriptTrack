import 'package:flutter/material.dart';

import '../settings_controller.dart';

class AppearanceScreen extends StatelessWidget {
  const AppearanceScreen({required this.controller, super.key});

  final SettingsController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Görünüm')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) => ListView(
          children: [
            const _SectionHeader('Tema'),
            _ThemeTile(
              label: 'Sisteme göre',
              icon: Icons.brightness_auto_outlined,
              mode: ThemeMode.system,
              current: controller.themeMode,
              onTap: () => controller.setThemeMode(ThemeMode.system),
            ),
            _ThemeTile(
              label: 'Aydınlık',
              icon: Icons.light_mode_outlined,
              mode: ThemeMode.light,
              current: controller.themeMode,
              onTap: () => controller.setThemeMode(ThemeMode.light),
            ),
            _ThemeTile(
              label: 'Karanlık',
              icon: Icons.dark_mode_outlined,
              mode: ThemeMode.dark,
              current: controller.themeMode,
              onTap: () => controller.setThemeMode(ThemeMode.dark),
            ),
            const Divider(),
            const _SectionHeader('Para birimi'),
            ...['₺', '\$', '€', '£'].map((c) => ListTile(
                  title: Text(c),
                  trailing: controller.currency == c
                      ? Icon(Icons.check,
                          color: Theme.of(context).colorScheme.primary)
                      : null,
                  onTap: () => controller.setCurrency(c),
                )),
          ],
        ),
      ),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  const _ThemeTile({
    required this.label,
    required this.icon,
    required this.mode,
    required this.current,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final ThemeMode mode;
  final ThemeMode current;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final selected = mode == current;
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: selected
          ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
          : null,
      onTap: onTap,
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
        child: Text(
          title,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
              ),
        ),
      );
}
