import 'package:flutter/material.dart';
import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';

class TrendHeader extends StatelessWidget {
  const TrendHeader({
    super.key,
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
          TrendRangeSelector(months: months, onChanged: onMonthsChanged),
      ],
    );
  }
}

class TrendRangeSelector extends StatelessWidget {
  const TrendRangeSelector(
      {super.key, required this.months, required this.onChanged});

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
            TrendRangeOption(
              months: m,
              selected: m == months,
              onTap: () => onChanged(m),
            ),
        ],
      ),
    );
  }
}

class TrendRangeOption extends StatelessWidget {
  const TrendRangeOption({
    super.key,
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

class TrendCurrentTotal extends StatelessWidget {
  const TrendCurrentTotal({
    super.key,
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
    final month = trendMonthLabel(DateTime.now());
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

class TrendNoHistoryHint extends StatelessWidget {
  const TrendNoHistoryHint({super.key});

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

String trendMonthLabel(DateTime d) {
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
