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
            const Divider(),
            const _SectionHeader('Saat dilimi'),
            _TimezoneTile(controller: controller),
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

class _TimezoneTile extends StatelessWidget {
  const _TimezoneTile({required this.controller});

  final SettingsController controller;

  static const _timezones = [
    ('Cihaz varsayılanı', ''),
    ('UTC', 'UTC'),
    ('Türkiye (UTC+3)', 'Europe/Istanbul'),
    ('Londra (UTC+0/+1)', 'Europe/London'),
    ('Paris / Berlin (UTC+1/+2)', 'Europe/Paris'),
    ('New York (UTC-5/-4)', 'America/New_York'),
    ('Los Angeles (UTC-8/-7)', 'America/Los_Angeles'),
    ('Dubai (UTC+4)', 'Asia/Dubai'),
    ('Moskova (UTC+3)', 'Europe/Moscow'),
    ('Hindistan (UTC+5:30)', 'Asia/Kolkata'),
    ('Singapur (UTC+8)', 'Asia/Singapore'),
    ('Tokyo (UTC+9)', 'Asia/Tokyo'),
    ('Sydney (UTC+10/+11)', 'Australia/Sydney'),
  ];

  String get _currentLabel {
    if (controller.timezone.isEmpty) return 'Cihaz varsayılanı';
    return _timezones
        .firstWhere((e) => e.$2 == controller.timezone,
            orElse: () => (controller.timezone, controller.timezone))
        .$1;
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.schedule_outlined),
      title: const Text('Saat dilimi'),
      subtitle: Text(_currentLabel),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => _showPicker(context),
    );
  }

  Future<void> _showPicker(BuildContext context) async {
    final colors = Theme.of(context).colorScheme;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (ctx, scrollCtrl) => Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text('Saat dilimi seç',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                children: _timezones
                    .map((e) => ListenableBuilder(
                          listenable: controller,
                          builder: (_, __) => ListTile(
                            title: Text(e.$1),
                            trailing: controller.timezone == e.$2
                                ? Icon(Icons.check, color: colors.primary)
                                : null,
                            onTap: () {
                              controller.setTimezone(e.$2);
                              Navigator.pop(ctx);
                            },
                          ),
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
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
