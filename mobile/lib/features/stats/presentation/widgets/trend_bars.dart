import 'package:flutter/material.dart';
import 'trend_card_parts.dart' show trendMonthLabel;

class TrendBars extends StatelessWidget {
  const TrendBars(
      {super.key, required this.values, required this.hasPaymentHistory});

  final List<int> values;
  final bool hasPaymentHistory;

  @override
  Widget build(BuildContext context) {
    final maxVal = values.fold<int>(1, (max, val) => val > max ? val : max);
    final now = DateTime.now();
    final last = values.length - 1;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (final (index, val) in values.indexed)
          Expanded(
            child: Padding(
              padding:
                  EdgeInsets.symmetric(horizontal: values.length > 6 ? 1 : 4),
              child: TrendBar(
                ratio: val <= 0 ? 0.0 : (val / maxVal).clamp(0.08, 1.0),
                isCurrent: index == last,
                dense: values.length > 6,
                hasPaymentHistory: hasPaymentHistory,
                label: _showLabel(index)
                    ? trendMonthLabel(
                        DateTime(now.year, now.month - (last - index)))
                    : '',
              ),
            ),
          ),
      ],
    );
  }

  bool _showLabel(int index) {
    final last = values.length - 1;
    return !hasPaymentHistory ||
        values.length <= 6 ||
        (index.isEven && index < last - 2) ||
        index == last;
  }
}

class TrendBar extends StatelessWidget {
  const TrendBar({
    super.key,
    required this.ratio,
    required this.isCurrent,
    required this.dense,
    required this.hasPaymentHistory,
    required this.label,
  });

  final double ratio;
  final bool isCurrent;
  final bool dense;
  final bool hasPaymentHistory;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final barColor = isCurrent
        ? cs.primary
        : (hasPaymentHistory
            ? cs.primary.withValues(alpha: 0.35)
            : cs.surfaceContainerHighest);
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: FractionallySizedBox(
              heightFactor: ratio,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(8),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontSize: dense ? 9 : null,
                letterSpacing: dense ? -0.3 : null,
                color: isCurrent ? cs.primary : cs.onSurfaceVariant,
                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w500,
              ),
          maxLines: 1,
          softWrap: false,
          overflow: TextOverflow.clip,
        ),
      ],
    );
  }
}
