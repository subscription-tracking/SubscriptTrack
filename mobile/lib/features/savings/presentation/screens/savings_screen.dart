import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../domain/savings_event.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class SavingsScreen extends StatelessWidget {
  const SavingsScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tasarruf analizi')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          if (controller.loading && controller.active.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          if (controller.error != null) return _errorView();
          if (controller.active.isEmpty) {
            return const Center(child: Text('Henüz abonelik yok.'));
          }
          return RefreshIndicator(
            onRefresh: controller.load,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: _content(context),
            ),
          );
        },
      ),
    );
  }

  Widget _errorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 12),
          Text(controller.error!, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: controller.load,
            child: const Text('Tekrar dene'),
          ),
        ]),
      ),
    );
  }

  List<Widget> _content(BuildContext context) {
    final active = controller.active;
    final titleMedium = Theme.of(context).textTheme.titleMedium;

    // Group by currency for top-3 scenario
    final byCurrency = <String, List<Subscription>>{};
    for (final s in active) {
      (byCurrency[s.currency] ??= []).add(s);
    }

    return [
      for (final entry in byCurrency.entries)
        _Top3Card(
          currency: entry.key,
          subscriptions: entry.value,
          showCurrency: byCurrency.length > 1,
        ),
      Text('Tasarruf fırsatları', style: titleMedium),
      const SizedBox(height: 12),
      ...active.map((s) => _SavingsRow(subscription: s)),
      if (controller.savingsEvents.isNotEmpty) ...[
        const SizedBox(height: 20),
        Text('İptal ve duraklatma geçmişi', style: titleMedium),
        const SizedBox(height: 12),
        ...controller.savingsEvents.map((e) => _SavingsEventTile(event: e)),
      ],
    ];
  }
}

/// Bir para biriminde en yüksek tutarlı 3 aboneliğin iptal senaryosu.
class _Top3Card extends StatelessWidget {
  const _Top3Card({
    required this.currency,
    required this.subscriptions,
    required this.showCurrency,
  });

  final String currency;
  final List<Subscription> subscriptions;
  final bool showCurrency;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final top3 = ([...subscriptions]
          ..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount)))
        .take(3);
    final monthly = top3.fold(Money.zero, (Money s, e) => s + e.monthlyAmount);
    final yearly = monthly * 12;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          color: Theme.of(context).colorScheme.primaryContainer,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  showCurrency
                      ? 'En yüksek tutarlı 3 $currency aboneliğini iptal edersen'
                      : 'En yüksek tutarlı 3 aboneliğini iptal edersen',
                  style: textTheme.titleSmall,
                ),
                const SizedBox(height: 12),
                Text(
                  '${DateTimeUtils.formatCurrency(yearly.amount, symbol: currency)}/yıl tasarruf',
                  style: textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  '${DateTimeUtils.formatCurrency(monthly.amount, symbol: currency)}/ay',
                  style: textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _SavingsEventTile extends StatelessWidget {
  const _SavingsEventTile({required this.event});

  final SavingsEvent event;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.trending_down_rounded),
        title: Text(event.eventType == 'PAUSED'
            ? 'Abonelik duraklatıldı'
            : 'Abonelik iptal edildi'),
        subtitle: Text(DateTimeUtils.formatDate(event.effectiveAt)),
        trailing: Text(
          '${DateTimeUtils.formatCurrency(event.annualAmount.amount, symbol: event.currency)}/yıl',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

class _SavingsRow extends StatelessWidget {
  const _SavingsRow({required this.subscription});
  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final yearly = subscription.monthlyAmount * 12;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(subscription.name),
        subtitle: Text(
            '${DateTimeUtils.formatCurrency(subscription.monthlyAmount.amount, symbol: subscription.currency)}/ay'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${DateTimeUtils.formatCurrency(yearly.amount, symbol: subscription.currency)}/yıl',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('Olası yıllık tasarruf',
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
