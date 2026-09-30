import 'package:flutter/material.dart';
import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/widgets/service_identity.dart';
import '../../../subscriptions/domain/subscription_models.dart';

class NextPaymentSummary extends StatelessWidget {
  const NextPaymentSummary(
      {super.key, required this.subscription, required this.urgent});

  final Subscription subscription;
  final bool urgent;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final days = subscription.daysUntilRenewal;
    final daysLabel = days < 0 ? '${days.abs()} gün geçti' : '$days gün kaldı';

    return Row(
      children: [
        ServiceIdentity(
          name: subscription.name,
          category: subscription.category,
          size: 46,
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                subscription.name,
                style: textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                '${DateTimeUtils.formatDate(subscription.nextRenewalDate)} · $daysLabel',
                style: textTheme.bodySmall?.copyWith(
                  color: urgent ? cs.error : context.statusColors.warning,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              DateTimeUtils.formatCurrency(
                subscription.amount.amount,
                symbol: subscription.currency,
              ),
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: cs.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Detay',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: cs.primary,
                  ),
                ),
                Icon(Icons.chevron_right_rounded, size: 14, color: cs.primary),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class NextPaymentReminderHint extends StatelessWidget {
  const NextPaymentReminderHint({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(Icons.notifications_active_outlined,
              size: 15, color: cs.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Yenileme öncesi hatırlatmayı abonelik ayrıntılarından yönetebilirsin',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: cs.onSurfaceVariant.withValues(alpha: 0.9),
              ),
            ),
          ),
          Text(
            'Hatırlatma ayarları',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: cs.primary,
            ),
          ),
        ],
      ),
    );
  }
}
