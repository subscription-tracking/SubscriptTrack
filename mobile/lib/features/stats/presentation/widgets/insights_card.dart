import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';

class InsightsCard extends StatelessWidget {
  const InsightsCard({
    required this.highestSub,
    required this.totalMonthly,
    required this.currency,
    required this.dueSubscriptions,
    required this.onReviewDue,
    super.key,
  });

  final Subscription? highestSub;
  final Money totalMonthly;
  final String currency;
  final List<Subscription> dueSubscriptions;
  final VoidCallback onReviewDue;

  /// En yüksek kalemin aylık toplamdaki yüzdesi.
  int get _sharePct {
    final top = highestSub;
    if (top == null || totalMonthly.minorUnits <= 0) return 0;
    return ((top.monthlyAmount.minorUnits / totalMonthly.minorUnits) * 100)
        .round();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final top = highestSub;

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
          Text(
            'Öne çıkanlar',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 16),
          if (top != null)
            _HighestExpense(
              subscription: top,
              currency: currency,
              sharePct: _sharePct,
            ),
          if (dueSubscriptions.isNotEmpty) ...[
            const SizedBox(height: 12),
            _DueSoonBanner(
              subscriptions: dueSubscriptions,
              onReview: onReviewDue,
            ),
          ],
        ],
      ),
    );
  }
}

/// En Yüksek Harcama Kalemi
class _HighestExpense extends StatelessWidget {
  const _HighestExpense({
    required this.subscription,
    required this.currency,
    required this.sharePct,
  });

  final Subscription subscription;
  final String currency;
  final int sharePct;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final name = subscription.name;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.4),
          width: 0.6,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: TextStyle(
                  color: cs.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'En Yüksek Gider: $name',
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'Aylık abonelik giderlerinin %$sharePct’ini oluşturuyor.',
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            DateTimeUtils.formatCurrency(
              subscription.monthlyAmount.amount,
              symbol: currency,
            ),
            style: textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

/// Yaklaşan Ödemeler Uyarısı
class _DueSoonBanner extends StatelessWidget {
  const _DueSoonBanner({required this.subscriptions, required this.onReview});

  final List<Subscription> subscriptions;
  final VoidCallback onReview;

  static const _amber = Color(0xFFF59E0B);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _amber.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _amber.withValues(alpha: 0.25),
          width: 0.6,
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: _amber, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${subscriptions.length} abonelik 7 gün içinde yenilenecek',
                  style: textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subscriptions.map((e) => e.name).join(', '),
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          FilledButton.tonal(
            onPressed: onReview,
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 40),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              visualDensity: VisualDensity.compact,
            ),
            child: const Text('İncele'),
          ),
        ],
      ),
    );
  }
}
