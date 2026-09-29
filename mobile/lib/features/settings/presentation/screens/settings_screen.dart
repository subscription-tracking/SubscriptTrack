import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/design/responsive.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../settings_controller.dart';
import '../../../../shared/widgets/app_confirm_dialog.dart';

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
            child: _AccountSummaryCard(
              initials: initials,
              name: hasDisplayName ? displayName : user.email.split('@').first,
              email: user.email,
              onTap: () => context.push(AppRoutes.profile),
            ),
          ),
          ..._preferences(context, settings),
          ..._appAndPrivacy(context, auth),
          const _SectionLabel('Destek'),
          _SettingTile(
            icon: Icons.feedback_outlined,
            label: 'Geri bildirim gönder',
            value: 'Hata veya öneri paylaş',
            onTap: () => context.push(AppRoutes.feedback),
          ),
          const SizedBox(height: 24),
          _SignOutButton(onPressed: () => _confirmSignOut(context, auth)),
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
      const _SectionLabel('Tercihler'),
      _SettingTile(
        icon: Icons.notifications_outlined,
        label: 'Bildirim ayarları',
        value: settings.notificationsEnabled ? 'Açık' : 'Kapalı',
        onTap: () => context.push(AppRoutes.notificationSettings),
      ),
      _SettingTile(
        icon: Icons.label_outline,
        label: 'Ödeme yöntemi seçenekleri',
        value: '${settings.paymentMethods.length} kayıtlı yöntem',
        onTap: () => context.push(AppRoutes.paymentMethods),
      ),
      _SettingTile(
        icon: Icons.tune_rounded,
        label: 'Para birimi ve saat dilimi',
        value: 'Tercihlerini düzenle',
        onTap: () => context.push(AppRoutes.appearance),
      ),
    ];
  }

  List<Widget> _appAndPrivacy(BuildContext context, AuthController auth) {
    return [
      const _SectionLabel('Uygulama'),
      _SettingTile(
        icon: Icons.replay_outlined,
        label: 'Tanıtım turunu yeniden başlat',
        value: 'Onboarding ekranlarını tekrar göster',
        onTap: auth.restartOnboarding,
      ),
      const _SectionLabel('Veri ve gizlilik'),
      _SettingTile(
        icon: Icons.lock_outline,
        label: 'Uygulama kilidi',
        value: 'PIN ve biyometri',
        onTap: () => context.push(AppRoutes.appLock),
      ),
      _SettingTile(
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
      child: Container(
        decoration: BoxDecoration(
          color: cs.surfaceContainerHigh,
          borderRadius: AppRadius.medium,
          border: Border.all(
            color: cs.outlineVariant.withValues(alpha: 0.5),
            width: 0.8,
          ),
        ),
        child: Material(
          color: Colors.transparent,
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
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
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
      ),
    );
  }
}

class _SignOutButton extends StatelessWidget {
  const _SignOutButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: OutlinedButton(
        onPressed: onPressed,
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
            Text('Çıkış Yap', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
