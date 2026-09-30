import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/design/responsive.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../settings_controller.dart';
import '../../../../shared/widgets/app_confirm_dialog.dart';
import '../widgets/settings_parts.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final settings = context.watch<SettingsController>();
    final user = auth.user;
    if (user == null) return const SizedBox.shrink();

    final displayName = user.displayName?.trim();
    final hasDisplayName = displayName != null && displayName.isNotEmpty;
    final initials = _initials(hasDisplayName ? displayName : user.email);

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
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: AccountSummaryCard(
              initials: initials,
              name: hasDisplayName ? displayName : user.email.split('@').first,
              email: user.email,
              onTap: () => context.push(AppRoutes.profile),
            ),
          ),
          ..._preferences(context, settings),
          ..._appAndPrivacy(context, auth),
          const SettingsSectionLabel('Destek'),
          SettingsTile(
            icon: Icons.feedback_outlined,
            label: 'Geri bildirim gönder',
            value: 'Hata veya öneri paylaş',
            onTap: () => context.push(AppRoutes.feedback),
          ),
          const SizedBox(height: 24),
          SignOutButton(onPressed: () => _confirmSignOut(context, auth)),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'v1.0.0',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _preferences(BuildContext context, SettingsController settings) {
    return [
      const SettingsSectionLabel('Tercihler'),
      SettingsTile(
        icon: Icons.notifications_outlined,
        label: 'Bildirim ayarları',
        value: settings.notificationsEnabled ? 'Açık' : 'Kapalı',
        onTap: () => context.push(AppRoutes.notificationSettings),
      ),
      SettingsTile(
        icon: Icons.label_outline,
        label: 'Ödeme yöntemi seçenekleri',
        value: '${settings.paymentMethods.length} kayıtlı yöntem',
        onTap: () => context.push(AppRoutes.paymentMethods),
      ),
      SettingsTile(
        icon: Icons.tune_rounded,
        label: 'Para birimi ve saat dilimi',
        value: 'Tercihlerini düzenle',
        onTap: () => context.push(AppRoutes.appearance),
      ),
    ];
  }

  List<Widget> _appAndPrivacy(BuildContext context, AuthController auth) {
    return [
      const SettingsSectionLabel('Uygulama'),
      SettingsTile(
        icon: Icons.replay_outlined,
        label: 'Tanıtım turunu yeniden başlat',
        value: 'Onboarding ekranlarını tekrar göster',
        onTap: auth.restartOnboarding,
      ),
      const SettingsSectionLabel('Veri ve gizlilik'),
      SettingsTile(
        icon: Icons.lock_outline,
        label: 'Uygulama kilidi',
        value: 'PIN ve biyometri',
        onTap: () => context.push(AppRoutes.appLock),
      ),
      SettingsTile(
        icon: Icons.privacy_tip_outlined,
        label: 'Gizlilik ve veri merkezi',
        value: 'Verileri dışa aktarma, yasal bilgiler ve hesap silme',
        onTap: () => context.push(AppRoutes.privacyCenter),
      ),
    ];
  }

  /// Görünen addan ("Ayşe Demir") veya e-postanın yerel kısmından
  /// ("ayse.demir@…") en fazla iki baş harf üretir.
  static String _initials(String source) {
    final base = source.split('@').first.trim();
    final parts =
        base.split(RegExp(r'[.\s_]+')).where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (base.isEmpty) return '?';
    return base.substring(0, base.length < 2 ? 1 : 2).toUpperCase();
  }

  static Future<void> _confirmSignOut(
      BuildContext context, AuthController auth) async {
    final confirmed = await AppConfirmDialog.show(
      context: context,
      title: 'Çıkış yap',
      message: 'Hesabından çıkmak istiyor musun?',
      confirmLabel: 'Çıkış yap',
      cancelLabel: 'İptal',
      isDestructive: true,
    );
    if (confirmed && context.mounted) {
      await auth.signOut();
    }
  }
}

// ─── Section Label ────────────────────────────────────────────────────────────

// ─── Setting Tile ─────────────────────────────────────────────────────────────
