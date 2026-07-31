import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../stats/presentation/screens/stats_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../subscriptions/presentation/screens/add_subscription_screen.dart';
import '../../../subscriptions/presentation/screens/subscription_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final active = controller.active;
        final upcoming = controller.upcomingRenewals;
        final total = controller.totalMonthly;

        return RefreshIndicator(
          onRefresh: controller.load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            children: [
              Text('Tekrar hoş geldin 👋',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              Text('Aboneliklerini tek bakışta takip et',
                  style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 20),
              _MonthlySpendCard(
                colors: colors,
                total: total,
                onAnalysisTap: active.isEmpty
                    ? null
                    : () => Navigator.push(
                          context,
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                StatsScreen(controller: controller),
                          ),
                        ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      label: 'Aktif abonelik',
                      value: '${active.length}',
                      icon: Icons.repeat,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      label: 'Bu ay yenileniyor',
                      value: '${upcoming.length}',
                      icon: Icons.event_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Yaklaşan yenilemeler',
                      style: Theme.of(context).textTheme.titleMedium),
                  if (upcoming.isNotEmpty)
                    TextButton(
                        onPressed: () {},
                        child: const Text('Tümünü gör')),
                ],
              ),
              const SizedBox(height: 8),
              if (upcoming.isEmpty)
                _EmptyRenewalsCard(colors: colors)
              else
                ...upcoming.map((s) => _RenewalTile(
                      subscription: s,
                      controller: controller,
                    )),
              const SizedBox(height: 20),
              if (active.isEmpty)
                FilledButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          AddSubscriptionScreen(controller: controller),
                    ),
                  ),
                  icon: const Icon(Icons.add),
                  label: const Text('İlk aboneliğini ekle'),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _MonthlySpendCard extends StatelessWidget {
  const _MonthlySpendCard({
    required this.colors,
    required this.total,
    this.onAnalysisTap,
  });

  final ColorScheme colors;
  final double total;
  final VoidCallback? onAnalysisTap;

  @override
  Widget build(BuildContext context) => Card(
        color: colors.primary,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.insights_outlined, color: colors.onPrimary),
                const SizedBox(height: 18),
                Text('Bu ay tahmini harcama',
                    style: TextStyle(
                        color: colors.onPrimary.withValues(alpha: .8))),
                const SizedBox(height: 4),
                Text(
                  DateTimeUtils.formatCurrency(total),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: colors.onPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  total == 0
                      ? 'Henüz abonelik eklenmedi'
                      : 'Aylık ortalama',
                  style: TextStyle(
                      color: colors.onPrimary.withValues(alpha: .8)),
                ),
                if (onAnalysisTap != null) ...[
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: onAnalysisTap,
                    icon: Icon(Icons.bar_chart,
                        color: colors.onPrimary, size: 18),
                    label: Text('Detaylı analiz',
                        style: TextStyle(color: colors.onPrimary)),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(
                          color: colors.onPrimary.withValues(alpha: .5)),
                    ),
                  ),
                ],
              ]),
        ),
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard(
      {required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 12),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
      );
}

class _EmptyRenewalsCard extends StatelessWidget {
  const _EmptyRenewalsCard({required this.colors});
  final ColorScheme colors;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
          child: Column(children: [
            Icon(Icons.calendar_month_outlined,
                size: 40, color: colors.primary),
            const SizedBox(height: 12),
            const Text('Yaklaşan yenileme yok'),
            const SizedBox(height: 4),
            Text(
              'Abonelik eklediğinde yenilemelerin burada görünecek.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ]),
        ),
      );
}

class _RenewalTile extends StatelessWidget {
  const _RenewalTile(
      {required this.subscription, required this.controller});

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final days = subscription.daysUntilRenewal;
    final colors = Theme.of(context).colorScheme;
    final urgent = days <= 3;

    return Card(
      child: ListTile(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => SubscriptionDetailScreen(
              subscription: subscription,
              controller: controller,
            ),
          ),
        ),
        leading: CircleAvatar(
          backgroundColor:
              urgent ? colors.errorContainer : colors.primaryContainer,
          child: Icon(Icons.event_outlined,
              color: urgent
                  ? colors.onErrorContainer
                  : colors.onPrimaryContainer),
        ),
        title: Text(subscription.name),
        subtitle: Text(DateTimeUtils.renewalLabel(days),
            style: TextStyle(color: urgent ? colors.error : null)),
        trailing: Text(
          DateTimeUtils.formatCurrency(subscription.amount,
              symbol: subscription.currency),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
