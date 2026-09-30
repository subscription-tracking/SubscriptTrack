import 'package:flutter/material.dart';

class DashboardQuickActionsRow extends StatelessWidget {
  const DashboardQuickActionsRow({
    required this.onAdd,
    this.onCalendar,
    this.onStats,
    super.key,
  });

  final VoidCallback onAdd;
  final VoidCallback? onCalendar;
  final VoidCallback? onStats;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            'Hızlı işlemler',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurfaceVariant.withValues(alpha: 0.9),
                ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: _QuickActionButton(
                icon: Icons.add_circle_outline_rounded,
                label: 'Abonelik ekle',
                color: cs.primary,
                onTap: onAdd,
              ),
            ),
            if (onCalendar != null) ...[
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.calendar_month_rounded,
                  label: 'Takvimi aç',
                  color: cs.secondary,
                  onTap: onCalendar!,
                ),
              ),
            ],
            if (onStats != null) ...[
              const SizedBox(width: 10),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.pie_chart_outline_rounded,
                  label: 'Dağılım',
                  color: cs.tertiary,
                  onTap: onStats!,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            color: cs.surfaceContainer,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: 0.12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurface,
                ),
                textAlign: TextAlign.center,
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
