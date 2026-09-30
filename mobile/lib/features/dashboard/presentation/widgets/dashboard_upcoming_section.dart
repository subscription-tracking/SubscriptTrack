import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import 'dashboard_next_payment_parts.dart';

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
                NextPaymentSummary(subscription: subscription, urgent: urgent),
                const SizedBox(height: 12),
                const NextPaymentReminderHint(),
              ],
            ),
          ),
        ),
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
  const DashboardEmptyIntro({super.key});

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
        ],
      ),
    );
  }
}
