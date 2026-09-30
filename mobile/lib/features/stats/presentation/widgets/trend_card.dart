import 'package:flutter/material.dart';
import 'stats_card_surface.dart';

import '../../../../core/domain/money.dart';
import 'trend_bars.dart';
import 'trend_card_parts.dart';

class TrendCard extends StatelessWidget {
  const TrendCard({
    required this.trend,
    required this.currency,
    required this.months,
    required this.hasPaymentHistory,
    required this.monthlyAmount,
    required this.onMonthsChanged,
    super.key,
  });

  final List<int> trend;
  final String currency;
  final int months;
  final bool hasPaymentHistory;
  final Money monthlyAmount;
  final ValueChanged<int> onMonthsChanged;

  @override
  Widget build(BuildContext context) {
    // Without payment events, show only the current monthly estimate. Repeating
    // today's estimate across past months would look like historical spending.
    final displayValues =
        hasPaymentHistory ? trend : [monthlyAmount.minorUnits];

    return StatsCardSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TrendHeader(
            hasPaymentHistory: hasPaymentHistory,
            months: months,
            onMonthsChanged: onMonthsChanged,
          ),
          const SizedBox(height: 20),
          TrendCurrentTotal(
            hasPaymentHistory: hasPaymentHistory,
            currency: currency,
            minorUnits: displayValues.last,
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 140,
            child: TrendBars(
              values: displayValues,
              hasPaymentHistory: hasPaymentHistory,
            ),
          ),
          if (!hasPaymentHistory) ...[
            const SizedBox(height: 16),
            const TrendNoHistoryHint(),
          ],
        ],
      ),
    );
  }
}
