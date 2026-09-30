import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../shared/widgets/app_animated_money.dart';
import '../../../stats/domain/payment_analytics.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import 'dashboard_hero_parts.dart';
export 'dashboard_hero_parts.dart';

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
            DashboardMonthChange(label: change),
          ],
          if (onAnalysisTap != null) ...[
            const SizedBox(height: 14),
            DashboardAnalysisLink(onTap: onAnalysisTap!),
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
