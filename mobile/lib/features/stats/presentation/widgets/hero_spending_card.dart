import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';

const _decreaseColor = Color(0xFF76B995);

class HeroSpendingCard extends StatelessWidget {
  const HeroSpendingCard({
    required this.monthly,
    required this.yearly,
    required this.currency,
    required this.activeCount,
    required this.trend,
    required this.hasPaymentHistory,
    super.key,
  });

  final Money monthly;
  final Money yearly;
  final String currency;
  final int activeCount;
  final List<int> trend;
  final bool hasPaymentHistory;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

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
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TitleRow(activeCount: activeCount),
          const SizedBox(height: 10),
          Text(
            DateTimeUtils.formatCurrency(monthly.amount, symbol: currency),
            style: textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _ChangeBadge(
                change: _change(),
                currency: currency,
                hasPaymentHistory: hasPaymentHistory,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Yıllık ${DateTimeUtils.formatCurrency(yearly.amount, symbol: currency)}',
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Bir önceki aya göre değişim (minor unit); veri yoksa 0.
  int _change() =>
      trend.length >= 2 ? monthly.minorUnits - trend[trend.length - 2] : 0;
}

class _TitleRow extends StatelessWidget {
  const _TitleRow({required this.activeCount});

  final int activeCount;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            'TAHMİNİ AYLIK ABONELİK GİDERİ',
            style: textTheme.labelSmall?.copyWith(
              letterSpacing: 1.2,
              fontWeight: FontWeight.w700,
              color: cs.onSurfaceVariant,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: cs.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Text(
            '$activeCount Aktif',
            style: textTheme.labelSmall?.copyWith(
              color: cs.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

/// Aylık değişimi (azalış / artış / aynı) veya geçmiş yoksa tahmin etiketini
/// gösteren rozet.
class _ChangeBadge extends StatelessWidget {
  const _ChangeBadge({
    required this.change,
    required this.currency,
    required this.hasPaymentHistory,
  });

  final int change;
  final String currency;
  final bool hasPaymentHistory;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final (icon, label, color, background) = _look(cs);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
          ),
        ],
      ),
    );
  }

  (IconData, String, Color, Color) _look(ColorScheme cs) {
    if (!hasPaymentHistory) {
      return (
        Icons.calendar_today_rounded,
        'Tahmini aylık gider',
        cs.onSurfaceVariant,
        cs.surfaceContainerHighest,
      );
    }
    if (change == 0) {
      return (
        Icons.horizontal_rule_rounded,
        'Aynı seviyede',
        cs.onSurfaceVariant,
        cs.surfaceContainerHighest,
      );
    }
    final down = change < 0;
    final abs = change.abs();
    final amount = Money.parse(
      '${abs ~/ 100}.${(abs % 100).toString().padLeft(2, '0')}',
    ).amount;
    final color = down ? _decreaseColor : cs.error;
    return (
      down ? Icons.south_east_rounded : Icons.north_east_rounded,
      '${DateTimeUtils.formatCurrency(amount, symbol: currency)} '
          '${down ? 'azalış' : 'artış'}',
      color,
      color.withValues(alpha: 0.15),
    );
  }
}
