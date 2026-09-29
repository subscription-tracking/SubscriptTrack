import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import 'dashboard_stat_chips.dart';

class DashboardCategoryDonutCard extends StatelessWidget {
  const DashboardCategoryDonutCard({
    required this.active,
    required this.onViewAll,
    super.key,
  });

  final List<Subscription> active;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final groups = _groupTotals();
    if (groups.isEmpty) return const SizedBox.shrink();

    final primaryCurrency = groups.values.first.currency;
    final entries = groups.entries
        .where((e) => e.value.currency == primaryCurrency)
        .toList()
      ..sort((a, b) => b.value.amount.compareTo(a.value.amount));
    final total = entries.fold<double>(0, (sum, e) => sum + e.value.amount);
    final slices = [
      for (final e in entries)
        (
          total == 0 ? 0.0 : e.value.amount / total,
          _groupColor(context, e.key)
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DashboardSectionHeader(
          title: 'Bu ayın görünümü',
          actionLabel: 'Tüm kategoriler',
          onAction: onViewAll,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surfaceContainer,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Row(
            children: [
              _DonutChart(
                slices: slices,
                total: total,
                currency: primaryCurrency,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final e in entries.take(3))
                      _LegendRow(
                        label: e.key,
                        percent: total == 0
                            ? 0
                            : (e.value.amount / total * 100).round(),
                        color: _groupColor(context, e.key),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Kategori gruplarına göre aylık tutar, para birimi ve adet toplamları.
  Map<String, ({double amount, String currency, int count})> _groupTotals() {
    final groups = <String, ({double amount, String currency, int count})>{};
    for (final sub in active) {
      final g = _group(sub.category);
      final existing = groups[g];
      groups[g] = (
        amount: (existing?.amount ?? 0) + sub.monthlyAmount.amount,
        currency: existing?.currency ?? sub.currency,
        count: (existing?.count ?? 0) + 1,
      );
    }
    return groups;
  }

  static String _group(SubscriptionCategory cat) => switch (cat) {
        SubscriptionCategory.streaming ||
        SubscriptionCategory.gaming ||
        SubscriptionCategory.news ||
        SubscriptionCategory.food =>
          'Eğlence',
        SubscriptionCategory.music => 'Müzik',
        SubscriptionCategory.software ||
        SubscriptionCategory.education =>
          'Üretkenlik',
        SubscriptionCategory.cloud ||
        SubscriptionCategory.fitness ||
        SubscriptionCategory.other =>
          'Araçlar',
      };

  static Color _groupColor(BuildContext context, String group) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    return switch (group) {
      'Eğlence' => cs.primary,
      'Müzik' => statusColors.success,
      'Üretkenlik' => cs.secondary,
      'Araçlar' => statusColors.warning,
      _ => cs.secondary,
    };
  }
}

class _DonutChart extends StatelessWidget {
  const _DonutChart({
    required this.slices,
    required this.total,
    required this.currency,
  });

  final List<(double, Color)> slices;
  final double total;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return SizedBox(
      width: 112,
      height: 112,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(112, 112),
            painter: DashboardDonutPainter(
              slices: slices,
              trackColor: cs.outlineVariant,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateTimeUtils.formatCurrency(total, symbol: currency),
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'toplam',
                    style: textTheme.labelSmall?.copyWith(
                      color: cs.onSurfaceVariant.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({
    required this.label,
    required this.percent,
    required this.color,
  });

  final String label;
  final int percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: textTheme.bodySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            '%$percent',
            style: textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class DashboardDonutPainter extends CustomPainter {
  DashboardDonutPainter({required this.slices, required this.trackColor});

  final List<(double, Color)> slices;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.13;
    final center = size.center(Offset.zero);
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);
    const gap = 0.02;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    var startAngle = -math.pi / 2;
    for (final slice in slices) {
      final sweepFraction = slice.$1;
      if (sweepFraction <= 0) continue;
      final sweep = 2 * math.pi * (sweepFraction - gap).clamp(0.0, 1.0);
      canvas.drawArc(
        rect,
        startAngle,
        sweep,
        false,
        Paint()
          ..color = slice.$2
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
      startAngle += 2 * math.pi * sweepFraction;
    }
  }

  @override
  bool shouldRepaint(covariant DashboardDonutPainter oldDelegate) =>
      oldDelegate.slices != slices || oldDelegate.trackColor != trackColor;
}
