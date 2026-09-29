import 'package:flutter/material.dart';
import '../../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../../core/utils/date_time_utils.dart';
import '../../../domain/subscription_models.dart';

class DetailNextPaymentCard extends StatelessWidget {
  const DetailNextPaymentCard({
    required this.subscription,
    required this.daysLeft,
    super.key,
  });

  final Subscription subscription;
  final int daysLeft;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColor = _statusColor(context);

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: 4,
              child: Container(color: statusColor),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              child: Row(
                children: [
                  Expanded(child: _dateColumn(cs)),
                  _daysBadge(statusColor),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (daysLeft < 0) return cs.error;
    if (daysLeft <= 3) return cs.tertiary;
    return daysLeft <= 7 ? context.statusColors.warning : cs.primary;
  }

  Widget _dateColumn(ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SONRAKİ ÖDEME',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: cs.onSurfaceVariant,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          DateTimeUtils.formatDate(subscription.nextRenewalDate),
          style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w800,
            color: cs.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _daysBadge(Color statusColor) {
    final isOverdue = daysLeft < 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: statusColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${daysLeft.abs()}',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: statusColor,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            isOverdue ? 'GÜN GECİKTİ' : 'GÜN KALDI',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: statusColor,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class DetailGridCategoryAndCycle extends StatelessWidget {
  const DetailGridCategoryAndCycle({
    required this.subscription,
    super.key,
  });

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: _InfoTile(
            title: 'KATEGORİ',
            value: subscription.category.label,
            icon: Icons.movie_filter_rounded,
            color: cs.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _InfoTile(
            title: 'YENİLEME SIKLIĞI',
            value: subscription.billingCycle.label,
            icon: Icons.update_rounded,
            color: cs.tertiary,
          ),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: cs.onSurfaceVariant,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withValues(alpha: 0.15),
                ),
                child: Icon(icon, size: 15, color: color),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
