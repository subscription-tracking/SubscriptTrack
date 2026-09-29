import 'package:flutter/material.dart';

class DashboardStatChipsRow extends StatelessWidget {
  const DashboardStatChipsRow({
    required this.activeCount,
    required this.upcomingCount,
    required this.annualLabel,
    super.key,
  });

  final int activeCount;
  final int upcomingCount;
  final String annualLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: DashboardStatChip(
            icon: Icons.refresh_rounded,
            label: '$activeCount aktif abonelik',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: DashboardStatChip(
            icon: Icons.notifications_active_outlined,
            label: 'Bu hafta $upcomingCount yenileme',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: DashboardStatChip(
            icon: Icons.bar_chart_rounded,
            label: annualLabel,
          ),
        ),
      ],
    );
  }
}

class DashboardStatChip extends StatelessWidget {
  const DashboardStatChip({
    required this.icon,
    required this.label,
    super.key,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: cs.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class DashboardSectionHeader extends StatelessWidget {
  const DashboardSectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
          ),
        ),
        if (actionLabel != null && onAction != null)
          GestureDetector(
            onTap: onAction,
            child: Text(
              actionLabel!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
      ],
    );
  }
}
