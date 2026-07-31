import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import 'edit_subscription_screen.dart';

class SubscriptionDetailScreen extends StatelessWidget {
  const SubscriptionDetailScreen({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(subscription.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => EditSubscriptionScreen(
                  subscription: subscription,
                  controller: controller,
                ),
              ),
            ),
          ),
          PopupMenuButton<_Action>(
            onSelected: (action) => _handleAction(context, action),
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: _Action.archive,
                child: Row(children: [
                  Icon(Icons.archive_outlined),
                  SizedBox(width: 12),
                  Text('Arşivle'),
                ]),
              ),
              PopupMenuItem(
                value: _Action.delete,
                child: Row(children: [
                  Icon(Icons.delete_outline, color: colors.error),
                  const SizedBox(width: 12),
                  Text('Sil', style: TextStyle(color: colors.error)),
                ]),
              ),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Tutar kartı
          Card(
            color: colors.primary,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tutar',
                      style: TextStyle(color: colors.onPrimary.withValues(alpha: .8))),
                  const SizedBox(height: 8),
                  Text(
                    DateTimeUtils.formatCurrency(subscription.amount,
                        symbol: subscription.currency),
                    style: text.headlineLarge?.copyWith(
                      color: colors.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(subscription.billingCycle.label,
                      style: TextStyle(color: colors.onPrimary.withValues(alpha: .8))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _InfoRow(
            icon: Icons.calendar_today_outlined,
            label: 'Sonraki yenileme',
            value: DateTimeUtils.formatDate(subscription.nextRenewalDate),
            sub: DateTimeUtils.renewalLabel(subscription.daysUntilRenewal),
          ),
          _InfoRow(
            icon: Icons.category_outlined,
            label: 'Kategori',
            value: subscription.category.label,
          ),
          _InfoRow(
            icon: Icons.insights_outlined,
            label: 'Aylık maliyet',
            value: DateTimeUtils.formatCurrency(
                subscription.monthlyAmount,
                symbol: subscription.currency),
          ),
          if (subscription.notes != null && subscription.notes!.isNotEmpty)
            _InfoRow(
              icon: Icons.notes,
              label: 'Notlar',
              value: subscription.notes!,
            ),
          _InfoRow(
            icon: Icons.access_time_outlined,
            label: 'Eklenme tarihi',
            value: DateTimeUtils.formatDate(subscription.createdAt),
          ),
        ],
      ),
    );
  }

  Future<void> _handleAction(BuildContext ctx, _Action action) async {
    if (action == _Action.archive) {
      await controller.archive(subscription.id);
      if (ctx.mounted) Navigator.pop(ctx);
    } else {
      final confirm = await showDialog<bool>(
        context: ctx,
        builder: (_) => AlertDialog(
          title: const Text('Aboneliği sil'),
          content:
              Text('${subscription.name} kalıcı olarak silinecek. Emin misin?'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('İptal')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: FilledButton.styleFrom(
                  backgroundColor: Theme.of(ctx).colorScheme.error),
              child: const Text('Sil'),
            ),
          ],
        ),
      );
      if (confirm == true) {
        await controller.delete(subscription.id);
        if (ctx.mounted) Navigator.pop(ctx);
      }
    }
  }
}

enum _Action { archive, delete }

class _InfoRow extends StatelessWidget {
  const _InfoRow(
      {required this.icon,
      required this.label,
      required this.value,
      this.sub});

  final IconData icon;
  final String label;
  final String value;
  final String? sub;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodySmall),
                Text(value,
                    style: const TextStyle(fontWeight: FontWeight.w500)),
                if (sub != null)
                  Text(sub!,
                      style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
