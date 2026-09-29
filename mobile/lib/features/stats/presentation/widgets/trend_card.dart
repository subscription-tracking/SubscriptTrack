import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';

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
    final cs = Theme.of(context).colorScheme;

    // Without payment events, show only the current monthly estimate. Repeating
    // today's estimate across past months would look like historical spending.
    final displayValues =
        hasPaymentHistory ? trend : [monthlyAmount.minorUnits];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Header(
            hasPaymentHistory: hasPaymentHistory,
            months: months,
            onMonthsChanged: onMonthsChanged,
          ),
          const SizedBox(height: 20),
          _CurrentTotal(
            hasPaymentHistory: hasPaymentHistory,
            currency: currency,
            minorUnits: displayValues.last,
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 140,
            child: _Bars(
              values: displayValues,
              hasPaymentHistory: hasPaymentHistory,
            ),
          ),
          if (!hasPaymentHistory) ...[
            const SizedBox(height: 16),
            const _NoHistoryHint(),
          ],
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.hasPaymentHistory,
    required this.months,
    required this.onMonthsChanged,
  });

  final bool hasPaymentHistory;
  final int months;
  final ValueChanged<int> onMonthsChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                hasPaymentHistory ? 'Ödeme geçmişi' : 'Aylık gider tahmini',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                hasPaymentHistory
                    ? 'Kaydedilen ödemeler'
                    : 'Aktif aboneliklerinin aylık toplamı',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        if (hasPaymentHistory)
          _RangeSelector(months: months, onChanged: onMonthsChanged),
      ],
    );
  }
}

class _RangeSelector extends StatelessWidget {
  const _RangeSelector({required this.months, required this.onChanged});

  final int months;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(100),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final m in const [3, 6, 12])
            _RangeOption(
              months: m,
              selected: m == months,
              onTap: () => onChanged(m),
            ),
        ],
      ),
    );
  }
}

class _RangeOption extends StatelessWidget {
  const _RangeOption({
    required this.months,
    required this.selected,
    required this.onTap,
  });

  final int months;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? cs.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          '$months Ay',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: selected ? cs.onPrimary : cs.onSurfaceVariant,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
        ),
      ),
    );
  }
}

class _CurrentTotal extends StatelessWidget {
  const _CurrentTotal({
    required this.hasPaymentHistory,
    required this.currency,
    required this.minorUnits,
  });

  final bool hasPaymentHistory;
  final String currency;
  final int minorUnits;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final month = _monthLabel(DateTime.now());
    final amount = Money.parse(
      '${minorUnits ~/ 100}.${(minorUnits % 100).toString().padLeft(2, '0')}',
    ).amount;
    return Row(
      children: [
        Expanded(
          child: Text(
            hasPaymentHistory ? '$month toplamı' : '$month tahmini',
            style: textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
          ),
        ),
        Text(
          DateTimeUtils.formatCurrency(amount, symbol: currency),
          style: textTheme.titleSmall?.copyWith(
            color: cs.primary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _Bars extends StatelessWidget {
  const _Bars({required this.values, required this.hasPaymentHistory});

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
              child: _Bar(
                ratio: val <= 0 ? 0.0 : (val / maxVal).clamp(0.08, 1.0),
                isCurrent: index == last,
                dense: values.length > 6,
                hasPaymentHistory: hasPaymentHistory,
                label: _showLabel(index)
                    ? _monthLabel(
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

class _Bar extends StatelessWidget {
  const _Bar({
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

class _NoHistoryHint extends StatelessWidget {
  const _NoHistoryHint();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded,
              size: 16, color: cs.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Geçmiş ödemeleri görüntülemek için abonelik ayrıntılarından ödeme kaydı ekle.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: cs.onSurfaceVariant,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

String _monthLabel(DateTime d) {
  const m = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara',
  ];
  return m[d.month - 1];
}
