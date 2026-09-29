import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/domain/money.dart';
import '../../../../shared/widgets/app_animated_money.dart';
import '../../../stats/domain/payment_analytics.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class DashboardHeroCard extends StatelessWidget {
  const DashboardHeroCard({
    required this.totals,
    this.monthChangeLabel,
    this.onAnalysisTap,
    this.completedThisMonth = 0,
    this.totalActive = 0,
    super.key,
  });

  final Map<String, Money> totals;
  final String? monthChangeLabel;
  final VoidCallback? onAnalysisTap;
  final int completedThisMonth;
  final int totalActive;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final change = monthChangeLabel;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _totalsColumn(context)),
              if (totalActive > 0)
                GestureDetector(
                  onTap: onAnalysisTap,
                  child: MonthProgressRing(
                    completed: completedThisMonth,
                    total: totalActive,
                  ),
                )
              else if (onAnalysisTap != null)
                AnalysisPill(onTap: onAnalysisTap!),
            ],
          ),
          if (change != null) ...[
            const SizedBox(height: 8),
            _MonthChange(label: change),
          ],
          if (onAnalysisTap != null) ...[
            const SizedBox(height: 14),
            _AnalysisLink(onTap: onAnalysisTap!),
          ],
        ],
      ),
    );
  }

  Widget _totalsColumn(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final amountStyle = textTheme.headlineLarge?.copyWith(
      color: cs.onSurface,
      fontSize: 36,
      fontWeight: FontWeight.w800,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tahmini aylık abonelik gideri',
          style: textTheme.bodySmall?.copyWith(
            color: cs.onSurfaceVariant.withValues(alpha: 0.9),
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 6),
        if (totals.isEmpty)
          Text('₺0,00', style: amountStyle)
        else
          for (final e in totals.entries)
            AppAnimatedMoney(
              amount: e.value.amount,
              symbol: e.key,
              style: amountStyle,
            ),
      ],
    );
  }

  static String? calculateMonthChange(SubscriptionController controller) {
    final percent =
        PaymentAnalytics.monthOverMonthPercent(controller.paymentEvents);
    if (percent == null) return null;
    final direction = percent <= 0 ? 'daha az' : 'daha fazla';
    return 'Geçen aya göre %${percent.abs()} $direction';
  }
}

class _MonthChange extends StatelessWidget {
  const _MonthChange({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    final decreased = label.contains('daha az');
    return Row(
      children: [
        Icon(
          decreased ? Icons.trending_down_rounded : Icons.trending_up_rounded,
          size: 16,
          color: decreased ? statusColors.success : statusColors.warning,
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: decreased ? statusColors.success : cs.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}

class _AnalysisLink extends StatelessWidget {
  const _AnalysisLink({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(Icons.insights_rounded, size: 16, color: cs.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Abonelik giderlerini incele',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.85),
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                size: 18, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class AnalysisPill extends StatelessWidget {
  const AnalysisPill({required this.onTap, super.key});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.insights_rounded, size: 16, color: cs.primary),
              const SizedBox(width: 6),
              Text(
                'Analiz',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: cs.primary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class MonthProgressRing extends StatelessWidget {
  const MonthProgressRing({
    required this.completed,
    required this.total,
    super.key,
  });

  final int completed;
  final int total;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final progress = total == 0 ? 0.0 : completed / total;
    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(64, 64),
            painter: RingPainter(
              progress: progress,
              color: cs.primary,
              trackColor: cs.primary.withValues(alpha: 0.15),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$completed/$total',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: cs.onSurface,
                    ),
              ),
              Text(
                'ödendi',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w600,
                      color: cs.onSurfaceVariant.withValues(alpha: 0.9),
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class RingPainter extends CustomPainter {
  RingPainter({
    required this.progress,
    required this.color,
    required this.trackColor,
  });

  final double progress;
  final Color color;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.14;
    final center = size.center(Offset.zero);
    final radius = (size.width - strokeWidth) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );

    final clamped = progress.clamp(0.0, 1.0);
    if (clamped > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * clamped,
        false,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(covariant RingPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.color != color ||
      oldDelegate.trackColor != trackColor;
}
