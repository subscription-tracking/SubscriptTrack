import 'package:flutter/material.dart';

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
          final active = controller.active;

          if (active.isEmpty) {
            return const Center(child: Text('Henüz abonelik yok.'));
          }

          // En pahalı 3 abonelik = iptal senaryosu
          final sorted = [...active]
            ..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount));
          final top3 = sorted.take(3).toList();
          final top3Monthly =
              top3.fold(0.0, (s, e) => s + e.monthlyAmount);
          final top3Yearly = top3Monthly * 12;

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'En pahalı 3 aboneliği iptal etseydin',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${DateTimeUtils.formatCurrency(top3Yearly)}/yıl tasarruf',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${DateTimeUtils.formatCurrency(top3Monthly)}/ay',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text('İptal senaryoları',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...active.map((s) => _SavingsRow(subscription: s)),
            ],
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
            '${DateTimeUtils.formatCurrency(subscription.monthlyAmount, symbol: subscription.currency)}/ay'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${DateTimeUtils.formatCurrency(yearly, symbol: subscription.currency)}/yıl',
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
