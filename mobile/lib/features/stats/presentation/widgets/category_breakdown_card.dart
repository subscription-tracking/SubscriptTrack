import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';

class CategoryBreakdownCard extends StatelessWidget {
  const CategoryBreakdownCard({
    required this.entries,
    required this.total,
    required this.currency,
    super.key,
  });

  final List<MapEntry<SubscriptionCategory, Money>> entries;
  final Money total;
  final String currency;

  static const _palette = [
    Color(0xFF8B82F6), // Indigo / Violet
    Color(0xFF10B981), // Emerald
    Color(0xFF3B82F6), // Blue
    Color(0xFFF59E0B), // Amber
    Color(0xFFEC4899), // Pink
    Color(0xFF06B6D4), // Cyan
    Color(0xFF84CC16), // Lime
  ];

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
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Kategori Dağılımı',
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${entries.length} Kategori',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          for (final (index, item) in entries.indexed)
            _CategoryRow(
              label: item.key.label,
              amount: item.value,
              currency: currency,
              share: total.minorUnits == 0
                  ? 0.0
                  : item.value.minorUnits / total.minorUnits,
              color: _palette[index % _palette.length],
            ),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({
    required this.label,
    required this.amount,
    required this.currency,
    required this.share,
    required this.color,
  });

  final String label;
  final Money amount;
  final String currency;
  final double share;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                DateTimeUtils.formatCurrency(amount.amount, symbol: currency),
                style: textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 40,
                child: Text(
                  '%${(share * 100).round()}',
                  textAlign: TextAlign.end,
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              value: share.clamp(0.01, 1.0),
              minHeight: 6,
              color: color,
              backgroundColor: cs.surfaceContainerHighest,
            ),
          ),
        ],
      ),
    );
  }
}
