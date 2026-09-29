import 'package:flutter/material.dart';

import '../../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../../core/utils/date_time_utils.dart';
import '../../../../../shared/widgets/service_identity.dart';
import '../../../../../shared/widgets/subscription_status_chip.dart';
import '../../../domain/subscription_models.dart';

class SubscriptionListTile extends StatelessWidget {
  const SubscriptionListTile({
    required this.subscription,
    required this.onTap,
    this.selectionMode = false,
    this.selected = false,
    this.onLongPress,
    this.showStatus = true,
    super.key,
  });

  final Subscription subscription;
  final VoidCallback onTap;
  final bool selectionMode;
  final bool selected;
  final VoidCallback? onLongPress;
  final bool showStatus;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final dimmed = subscription.status == SubscriptionStatus.paused ||
        subscription.status == SubscriptionStatus.cancelled;
    return Material(
      color: cs.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? cs.primary : cs.outlineVariant,
              width: selected ? 1.5 : 0.5,
            ),
          ),
          child: Row(
            children: [
              if (selectionMode) ...[
                Checkbox(value: selected, onChanged: (_) => onTap()),
                const SizedBox(width: 4),
              ],
              Opacity(
                opacity: dimmed ? .55 : 1,
                child: ServiceIdentity(
                  name: subscription.name,
                  category: subscription.category,
                  size: 42,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _TileTitle(
                  subscription: subscription,
                  showStatus: showStatus,
                ),
              ),
              const SizedBox(width: 12),
              _TileTrailing(subscription: subscription),
            ],
          ),
        ),
      ),
    );
  }
}

class _TileTitle extends StatelessWidget {
  const _TileTitle({required this.subscription, required this.showStatus});

  final Subscription subscription;
  final bool showStatus;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final status = subscription.status;
    final showChip = showStatus &&
        (status == SubscriptionStatus.paused ||
            status == SubscriptionStatus.cancelled);
    final subtitle = Text(
      '${subscription.category.label} · ${subscription.billingCycle.label}',
      style: textTheme.bodySmall?.copyWith(
        color: cs.onSurfaceVariant.withValues(alpha: 0.9),
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          subscription.name,
          style: textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            decoration: status == SubscriptionStatus.cancelled
                ? TextDecoration.lineThrough
                : null,
          ),
        ),
        const SizedBox(height: 2),
        if (showChip)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(child: subtitle),
              const SizedBox(width: 6),
              SubscriptionStatusChip(
                status: status,
                isNotStarted: subscription.isNotStarted,
                daysUntilRenewal: subscription.daysUntilRenewal,
              ),
            ],
          )
        else
          subtitle,
      ],
    );
  }
}

class _TileTrailing extends StatelessWidget {
  const _TileTrailing({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;
    final isPaused = subscription.status == SubscriptionStatus.paused;
    final isCancelled = subscription.status == SubscriptionStatus.cancelled;
    final labelColor = isPaused
        ? cs.onSurfaceVariant
        : isCancelled
            ? context.statusColors.success
            : urgent
                ? cs.error
                : cs.onSurfaceVariant.withValues(alpha: 0.85);
    final label = isPaused
        ? 'Duraklatıldı'
        : isCancelled
            ? 'İptal edildi'
            : DateTimeUtils.renewalLabel(days);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          DateTimeUtils.formatCurrency(
            subscription.amount.amount,
            symbol: subscription.currency,
          ),
          style: textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w800,
            fontSize: 16,
            color: isCancelled || isPaused ? cs.onSurfaceVariant : cs.onSurface,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          textAlign: TextAlign.right,
          style: textTheme.bodySmall?.copyWith(
            color: labelColor,
            fontSize: 11,
            fontWeight: urgent ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
