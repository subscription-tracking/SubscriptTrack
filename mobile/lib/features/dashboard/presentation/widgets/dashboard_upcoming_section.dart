import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/widgets/service_identity.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class DashboardNextPaymentCard extends StatelessWidget {
  const DashboardNextPaymentCard({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final urgent = subscription.daysUntilRenewal <= 3;

    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: urgent ? cs.error.withValues(alpha: 0.5) : cs.outlineVariant,
          width: 0.75,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => context.push(AppRoutes.subscription(subscription.id)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _NextPaymentSummary(subscription: subscription, urgent: urgent),
                const SizedBox(height: 12),
                const _ReminderHint(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NextPaymentSummary extends StatelessWidget {
  const _NextPaymentSummary({required this.subscription, required this.urgent});

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

class _ReminderHint extends StatelessWidget {
  const _ReminderHint();

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

class DashboardEmptyRenewalsCard extends StatelessWidget {
  const DashboardEmptyRenewalsCard({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.primary.withValues(alpha: 0.1),
              border: Border.all(
                  color: cs.primary.withValues(alpha: 0.2), width: 0.5),
            ),
            child: Icon(Icons.check_circle_outline_rounded,
                size: 26, color: cs.primary),
          ),
          const SizedBox(height: 14),
          Text(
            'Yaklaşan yenileme yok',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Bu hafta yenileme yok.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class DashboardTrialList extends StatelessWidget {
  const DashboardTrialList({
    required this.trials,
    required this.controller,
    super.key,
  });

  final List<Subscription> trials;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: trials
          .map((sub) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DashboardNextPaymentCard(
                  subscription: sub,
                  controller: controller,
                ),
              ))
          .toList(),
    );
  }
}

class DashboardSavingsSummary extends StatelessWidget {
  const DashboardSavingsSummary({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final entries = controller.savingsByCurrency.entries.toList();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Tahmini yıllık tasarruf',
              style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 6),
          Text('İptal edilen veya duraklatılan aboneliklerden',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          ...entries.map((entry) => Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(entry.key),
                  Text(
                      '${DateTimeUtils.formatCurrency(entry.value.amount, symbol: entry.key)}/yıl',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              )),
        ]),
      ),
    );
  }
}

class DashboardEmptyIntro extends StatelessWidget {
  const DashboardEmptyIntro({required this.onAdd, super.key});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ana sayfanı oluşturmaya başla',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
              'Aboneliklerini ekle; aylık giderlerini, yenileme tarihlerini ve ücretsiz denemelerini tek yerde takip et.',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 10),
          TextButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Hemen başla')),
        ],
      ),
    );
  }
}
