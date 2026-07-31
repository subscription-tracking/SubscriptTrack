import 'package:flutter/material.dart';

import '../../../auth/presentation/auth_controller.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../settings_controller.dart';
import 'appearance_screen.dart';
import 'delete_account_screen.dart';
import 'export_data_screen.dart';
import 'notification_preferences_screen.dart';
import 'profile_screen.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({
    required this.auth,
    required this.subscriptions,
    required this.settings,
    super.key,
  });

  final AuthController auth;
  final SubscriptionController subscriptions;
  final SettingsController settings;

  @override
  Widget build(BuildContext context) {
    final user = auth.user!;
    final colors = Theme.of(context).colorScheme;

    return ListenableBuilder(
      listenable: settings,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          // Kullanıcı bilgisi
          ListTile(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => ProfileScreen(user: user),
              ),
            ),
            leading: CircleAvatar(
              backgroundColor: colors.primaryContainer,
              child: Text(
                user.email[0].toUpperCase(),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: colors.onPrimaryContainer,
                ),
              ),
            ),
            title: Text(user.email,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: const Text('Profili görüntüle'),
            trailing: const Icon(Icons.chevron_right),
          ),
          const Divider(height: 24),

          // Görünüm
          _SettingTile(
            icon: Icons.palette_outlined,
            label: 'Görünüm ve para birimi',
            subtitle: '${_themeName(settings.themeMode)} · ${settings.currency}',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => AppearanceScreen(controller: settings),
              ),
            ),
          ),

          // Bildirimler
          _SettingTile(
            icon: Icons.notifications_outlined,
            label: 'Bildirimler',
            subtitle: settings.notificationsEnabled ? 'Açık' : 'Kapalı',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) =>
                    NotificationPreferencesScreen(controller: settings),
              ),
            ),
          ),

          // Dışa aktar
          _SettingTile(
            icon: Icons.download_outlined,
            label: 'Veri dışa aktar',
            subtitle: 'CSV formatında',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) =>
                    ExportDataScreen(subscriptions: subscriptions),
              ),
            ),
          ),

          const Divider(height: 24),

          // Çıkış
          _SettingTile(
            icon: Icons.logout,
            label: 'Çıkış yap',
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Çıkış yap'),
                  content:
                      const Text('Hesabından çıkmak istiyor musun?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('İptal'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Çıkış yap'),
                    ),
                  ],
                ),
              );
              if (confirm == true) auth.signOut();
            },
          ),

          // Hesabı sil
          _SettingTile(
            icon: Icons.delete_forever_outlined,
            label: 'Hesabı sil',
            color: colors.error,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => DeleteAccountScreen(auth: auth),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _themeName(ThemeMode mode) => switch (mode) {
        ThemeMode.system => 'Sistem',
        ThemeMode.light => 'Aydınlık',
        ThemeMode.dark => 'Karanlık',
      };
}

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.color,
  });

  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurface;
    return ListTile(
      leading: Icon(icon, color: c),
      title: Text(label, style: TextStyle(color: c)),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
