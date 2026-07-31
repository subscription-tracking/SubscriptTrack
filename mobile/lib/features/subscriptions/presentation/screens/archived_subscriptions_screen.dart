import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import 'subscription_detail_screen.dart';

class ArchivedSubscriptionsScreen extends StatelessWidget {
  const ArchivedSubscriptionsScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Arşiv')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          final archived = controller.archived;

          if (archived.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.archive_outlined,
                      size: 64,
                      color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 16),
                  const Text('Arşivlenmiş abonelik yok'),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: archived.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final sub = archived[i];
              final colors = Theme.of(context).colorScheme;

              return Card(
                child: ListTile(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => SubscriptionDetailScreen(
                        subscription: sub,
                        controller: controller,
                      ),
                    ),
                  ),
                  leading: CircleAvatar(
                    backgroundColor: colors.surfaceContainerHighest,
                    child: Icon(Icons.archive_outlined,
                        color: colors.onSurfaceVariant),
                  ),
                  title: Text(sub.name,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(sub.billingCycle.label),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        DateTimeUtils.formatCurrency(sub.amount,
                            symbol: sub.currency),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(sub.category.label,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
