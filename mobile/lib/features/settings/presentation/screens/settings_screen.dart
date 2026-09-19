import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../auth/presentation/auth_controller.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../settings_controller.dart';
import 'appearance_screen.dart';
import 'delete_account_screen.dart';
import 'export_data_screen.dart';
import 'notification_preferences_screen.dart';
import 'payment_methods_screen.dart';
import 'profile_screen.dart';
import 'privacy_center_screen.dart';
import 'feedback_screen.dart';
import 'app_lock_settings_screen.dart';
import '../../../../core/services/app_lock_service.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final settings = context.watch<SettingsController>();
    final subscriptions = context.read<SubscriptionController>();
    final user = auth.user;
    if (user == null) return const SizedBox.shrink();

    final displayName = user.displayName?.trim();
    final hasDisplayName = displayName != null && displayName.isNotEmpty;
    final initials = _initials(hasDisplayName ? displayName : user.email);
    final cs = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(0, 0, 0, 120),
      children: [
        // ── Avatar + Name ──────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          child: Column(
            children: [
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => ProfileScreen(auth: auth),
                  ),
                ),
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: cs.primary.withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          initials,
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(
                                color: cs.primary,
                                fontWeight: FontWeight.w800,
                                fontSize: 28,
                              ),
                        ),
                      ),
                    ),
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHigh,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.edit_outlined,
                          size: 13, color: cs.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                hasDisplayName ? displayName : user.email.split('@').first,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                user.email,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: cs.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const Divider(height: 1, indent: 0, endIndent: 0),

        // ── Bildirimler ────────────────────────────────────────────────────
        const _SectionLabel('Bildirimler'),
        _SettingTile(
          icon: Icons.notifications_outlined,
          label: 'Bildirim ayarları',
          value: settings.notificationsEnabled ? 'Açık' : 'Kapalı',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) =>
                  NotificationPreferencesScreen(controller: settings),
            ),
          ),
        ),

        // ── Ödeme Yöntemleri ──────────────────────────────────────────────
        const _SectionLabel('Ödeme Yöntemleri'),
        _SettingTile(
          icon: Icons.credit_card_outlined,
          label: 'Ödeme yöntemlerim',
          value: '${settings.paymentMethods.length} kayıtlı kart/yöntem',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => PaymentMethodsScreen(controller: settings),
            ),
          ),
        ),

        // ── Görünüm ────────────────────────────────────────────────────────
        const _SectionLabel('Görünüm'),
        _SettingTile(
          icon: Icons.palette_outlined,
          label: 'Tema ve para birimi',
          value: '${_themeName(settings.themeMode)} · ${settings.currency}',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => AppearanceScreen(controller: settings),
            ),
          ),
        ),

        // ── Veri & Gizlilik ────────────────────────────────────────────────
        const _SectionLabel('Veri & Gizlilik'),
        _SettingTile(
          icon: Icons.lock_outline,
          label: 'Uygulama kilidi',
          value: 'PIN ve biyometri',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) =>
                    AppLockSettingsScreen(service: AppLockService.instance),
              )),
        ),
        _SettingTile(
          icon: Icons.privacy_tip_outlined,
          label: 'Gizlilik ve veri merkezi',
          value: 'Veri kontrolü ve silme',
          onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => PrivacyCenterScreen(
                    auth: auth, subscriptions: subscriptions),
              )),
        ),
        _SettingTile(
          icon: Icons.feedback_outlined,
          label: 'Geri bildirim gönder',
          value: 'Bug veya öneri paylaş',
          onTap: () => Navigator.push(context,
              MaterialPageRoute<void>(builder: (_) => const FeedbackScreen())),
        ),
        _SettingTile(
          icon: Icons.download_outlined,
          label: 'Veriyi dışa aktar',
          value: 'CSV formatında',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => ExportDataScreen(subscriptions: subscriptions),
            ),
          ),
        ),
        _SettingTile(
          icon: Icons.delete_forever_outlined,
          label: 'Hesabı sil',
          valueColor: cs.error,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => DeleteAccountScreen(auth: auth),
            ),
          ),
        ),

        // ── Çıkış ──────────────────────────────────────────────────────────
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: OutlinedButton(
            onPressed: () => _confirmSignOut(context, auth),
            style: OutlinedButton.styleFrom(
              foregroundColor: cs.error,
              side: BorderSide(color: cs.error),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.logout, size: 18),
                SizedBox(width: 8),
                Text(
                  'Çıkış Yap',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            'v1.0.0',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: cs.onSurfaceVariant),
          ),
        ),
      ],
    );
  }

  static String _initials(String email) {
    final parts = email.split('@').first.split('.');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  static String _themeName(ThemeMode mode) => switch (mode) {
        ThemeMode.system => 'Sistem',
        ThemeMode.light => 'Aydınlık',
        ThemeMode.dark => 'Karanlık',
      };

  static Future<void> _confirmSignOut(
      BuildContext context, AuthController auth) async {
    final cs = Theme.of(context).colorScheme;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: cs.surfaceContainerHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Çıkış yap'),
        content: const Text('Hesabından çıkmak istiyor musun?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: cs.error),
            child: const Text('Çıkış yap'),
          ),
        ],
      ),
    );
    if (confirm == true && context.mounted) {
      auth.signOut();
    }
  }
}

// ─── Section Label ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 11,
              letterSpacing: 1.0,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

// ─── Setting Tile ─────────────────────────────────────────────────────────────

class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String? value;
  final Color? valueColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final labelColor = valueColor ?? cs.onSurface;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            border: Border(
                bottom: BorderSide(color: cs.outlineVariant, width: 0.5)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: labelColor),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: labelColor,
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              if (value != null) ...[
                const SizedBox(width: 8),
                Text(
                  value!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                ),
              ],
              const SizedBox(width: 4),
              Icon(Icons.chevron_right,
                  size: 18, color: cs.onSurfaceVariant.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
