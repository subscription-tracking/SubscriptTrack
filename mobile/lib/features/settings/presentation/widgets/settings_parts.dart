import 'package:flutter/material.dart';
import '../../../../shared/design/app_tokens.dart';

class SettingsSectionLabel extends StatelessWidget {
  const SettingsSectionLabel(this.label, {super.key});
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

class SettingsTile extends StatelessWidget {
  const SettingsTile({
    super.key,
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

class AccountSummaryCard extends StatelessWidget {
  const AccountSummaryCard({
    super.key,
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

class SignOutButton extends StatelessWidget {
  const SignOutButton({super.key, required this.onPressed});

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
