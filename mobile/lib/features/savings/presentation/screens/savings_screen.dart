import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
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

          if (controller.error != null) {
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

          final active = controller.active;

          if (active.isEmpty) {
            return const Center(child: Text('Henüz abonelik yok.'));
          }

          // Group by currency for top-3 scenario
          final byCurrency = <String, List<Subscription>>{};
          for (final s in active) {
            (byCurrency[s.currency] ??= []).add(s);
          }

          return RefreshIndicator(
            onRefresh: controller.load,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                ...byCurrency.entries.map((entry) {
                  final currency = entry.key;
                  final subs = entry.value
                    ..sort((a, b) =>
                        b.monthlyAmount.compareTo(a.monthlyAmount));
                  final top3 = subs.take(3).toList();
                  final top3Monthly =
                      top3.fold(Money.zero, (Money s, e) => s + e.monthlyAmount);
                  final top3Yearly = top3Monthly * 12;

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
                                byCurrency.length > 1
                                    ? 'En pahalı $currency abonelikleri ($currency) iptal etseydin'
                                    : 'En pahalı 3 aboneliği iptal etseydin',
                                style:
                                    Theme.of(context).textTheme.titleSmall,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                '${DateTimeUtils.formatCurrency(top3Yearly.amount, symbol: currency)}/yıl tasarruf',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${DateTimeUtils.formatCurrency(top3Monthly.amount, symbol: currency)}/ay',
                                style:
                                    Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  );
                }),
                Text('İptal senaryoları',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ...active.map((s) => _SavingsRow(subscription: s)),
              ],
            ),
          );
        },
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
            Text('iptal tasarrufu',
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
