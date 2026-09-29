import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';

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
          if (archived.isEmpty) return const _EmptyArchive();

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: archived.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) => _ArchivedTile(
              subscription: archived[i],
              onRestore: () => _restore(context, archived[i]),
            ),
          );
        },
      ),
    );
  }

  Future<void> _restore(BuildContext context, Subscription sub) async {
    await controller.restore(sub.id);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${sub.name} aktif aboneliklerine eklendi.')),
    );
  }
}

class _EmptyArchive extends StatelessWidget {
  const _EmptyArchive();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.archive_outlined,
              size: 64, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 16),
          const Text('Arşivlenmiş abonelik yok'),
        ],
      ),
    );
  }
}

class _ArchivedTile extends StatelessWidget {
  const _ArchivedTile({required this.subscription, required this.onRestore});

  final Subscription subscription;
  final VoidCallback onRestore;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final sub = subscription;

    return Card(
      child: ListTile(
        onTap: () => context.push(AppRoutes.subscription(sub.id)),
        leading: CircleAvatar(
          backgroundColor: colors.surfaceContainerHighest,
          child: Icon(Icons.archive_outlined, color: colors.onSurfaceVariant),
        ),
        title:
            Text(sub.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(sub.billingCycle.label),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  DateTimeUtils.formatCurrency(sub.amount.amount,
                      symbol: sub.currency),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(sub.category.label,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            const SizedBox(width: 8),
            IconButton(
              tooltip: 'Aktif yap',
              icon: Icon(Icons.unarchive_outlined, color: colors.primary),
              onPressed: onRestore,
            ),
          ],
        ),
      ),
    );
  }
}
