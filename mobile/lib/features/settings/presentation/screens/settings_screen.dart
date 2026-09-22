import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/design/responsive.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../settings_controller.dart';
import 'appearance_screen.dart';
import 'notification_preferences_screen.dart';
import 'payment_methods_screen.dart';
import 'profile_screen.dart';
import 'privacy_center_screen.dart';
import 'app_lock_settings_screen.dart';
import '../../../../core/services/app_lock_service.dart';
import 'feedback_screen.dart';

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

    return ResponsiveCenter(
      child: ListView(
        padding: EdgeInsets.fromLTRB(
            0,
            0,
            0,
            AppSizes.bottomNavHeight +
                MediaQuery.paddingOf(context).bottom +
                AppSpacing.xl),
        children: [
          // ── Hesap özeti ────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: _AccountSummaryCard(
              initials: initials,
              name: hasDisplayName ? displayName : user.email.split('@').first,
              email: user.email,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                    builder: (_) => ProfileScreen(auth: auth)),
              ),
            ),
          ),

          // ── Tercihler ──────────────────────────────────────────────────────
          const _SectionLabel('Tercihler'),
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

          _SettingTile(
            icon: Icons.label_outline,
            label: 'Ödeme etiketi seçenekleri',
            value: '${settings.paymentMethods.length} kayıtlı etiket',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => PaymentMethodsScreen(controller: settings),
              ),
            ),
          ),

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

          // ── Uygulama ───────────────────────────────────────────────────────
          const _SectionLabel('Uygulama'),
          _SettingTile(
            icon: Icons.replay_outlined,
            label: 'Tanıtım turunu yeniden başlat',
            value: 'Onboarding ekranlarını tekrar göster',
            onTap: auth.restartOnboarding,
          ),

          // ── Veri ve gizlilik ───────────────────────────────────────────────
          const _SectionLabel('Veri ve gizlilik'),
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
            value: 'Export, yasal bilgiler ve hesap silme',
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => PrivacyCenterScreen(
                      auth: auth, subscriptions: subscriptions),
                )),
          ),
          // ── Destek ─────────────────────────────────────────────────────────
          const _SectionLabel('Destek'),
          _SettingTile(
            icon: Icons.feedback_outlined,
            label: 'Geri bildirim gönder',
            value: 'Bug veya öneri paylaş',
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                    builder: (_) => const FeedbackScreen())),
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
      ),
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
    return Semantics(
      header: true,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 13,
                letterSpacing: 0.2,
                fontWeight: FontWeight.w600,
              ),
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
  });

  final IconData icon;
  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final labelColor = cs.onSurface;

    return Semantics(
      button: true,
      label: value == null ? label : '$label, $value',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: ConstrainedBox(
            constraints:
                const BoxConstraints(minHeight: AppSizes.minTouchTarget),
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
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: labelColor,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ),
                  if (value != null) ...[
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        value!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                      ),
                    ),
                  ],
                  const SizedBox(width: 4),
                  Icon(Icons.chevron_right,
                      size: 20, color: cs.onSurfaceVariant),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AccountSummaryCard extends StatelessWidget {
  const _AccountSummaryCard({
    required this.initials,
    required this.name,
    required this.email,
    required this.onTap,
  });

  final String initials;
  final String name;
  final String email;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: 'Hesap bilgileri, $name',
      child: Material(
        color: cs.surfaceContainerHigh,
        borderRadius: AppRadius.medium,
        child: InkWell(
          borderRadius: AppRadius.medium,
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: cs.primary.withValues(alpha: 0.16),
                child: Text(
                  initials,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: cs.primary,
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hesap bilgileri',
                        style:
                            Theme.of(context).textTheme.labelMedium?.copyWith(
                                  color: cs.onSurfaceVariant,
                                )),
                    const SizedBox(height: 2),
                    Text(name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                )),
                    const SizedBox(height: 2),
                    Text(email,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            )),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
            ]),
          ),
        ),
      ),
    );
  }
}
