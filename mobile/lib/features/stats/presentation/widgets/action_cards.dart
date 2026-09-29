import 'package:flutter/material.dart';

class ActionCards extends StatelessWidget {
  const ActionCards({
    required this.onSavingsTap,
    required this.onPaymentHistoryTap,
    super.key,
  });

  final VoidCallback onSavingsTap;
  final VoidCallback onPaymentHistoryTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(
          child: ActionTile(
            icon: Icons.trending_down_rounded,
            iconColor: const Color(0xFF10B981),
            title: 'Tasarruf Analizi',
            subtitle: 'Tasarruf fırsatları',
            onTap: onSavingsTap,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ActionTile(
            icon: Icons.receipt_long_rounded,
            iconColor: cs.primary,
            title: 'Ödeme Geçmişi',
            subtitle: 'Kayıtları yönet',
            onTap: onPaymentHistoryTap,
          ),
        ),
      ],
    );
  }
}

class ActionTile extends StatelessWidget {
  const ActionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: cs.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: cs.outlineVariant.withValues(alpha: 0.6),
              width: 0.8,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
