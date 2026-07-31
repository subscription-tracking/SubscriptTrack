import 'package:flutter/material.dart';

import '../../../../core/utils/date_time_utils.dart';
import '../../../savings/presentation/screens/savings_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({required this.controller, super.key});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Harcama analizi')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          final active = controller.active;

          if (active.isEmpty) {
            return const Center(
              child: Text('Henüz abonelik yok.'),
            );
          }

          final monthly = controller.totalMonthly;
          final yearly = monthly * 12;
          final byCategory = _groupByCategory(active);
          final byCycle = _groupByCycle(active);
          final mostExpensive = [...active]
            ..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount));

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              // Özet kartlar
              Row(children: [
                Expanded(
                  child: _StatCard(
                    label: 'Aylık toplam',
                    value: DateTimeUtils.formatCurrency(monthly),
                    icon: Icons.calendar_month_outlined,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'Yıllık toplam',
                    value: DateTimeUtils.formatCurrency(yearly),
                    icon: Icons.insights_outlined,
                    color: Theme.of(context).colorScheme.secondary,
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: _StatCard(
                    label: 'Aktif abonelik',
                    value: '${active.length}',
                    icon: Icons.repeat,
                    color: Theme.of(context).colorScheme.tertiary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    label: 'Abonelik başı ort.',
                    value: DateTimeUtils.formatCurrency(
                        active.isEmpty ? 0 : monthly / active.length),
                    icon: Icons.calculate_outlined,
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ]),

              const SizedBox(height: 24),

              // Kategori dağılımı
              Text('Kategoriye göre',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...byCategory.entries.map((e) {
                final pct = monthly > 0 ? e.value / monthly : 0.0;
                return _CategoryBar(
                  label: e.key.label,
                  amount: e.value,
                  percent: pct,
                );
              }),

              const SizedBox(height: 24),

              // Ödeme döngüsü dağılımı
              Text('Ödeme döngüsüne göre',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...byCycle.entries.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(children: [
                      Expanded(child: Text(e.key.label)),
                      Text(
                        '${e.value} abonelik',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ]),
                  )),

              const SizedBox(height: 24),

              // En pahalı abonelikler
              Text('En pahalı abonelikler',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...mostExpensive.take(5).map((s) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(s.name),
                      subtitle: Text(s.billingCycle.label),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            DateTimeUtils.formatCurrency(s.amount,
                                symbol: s.currency),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${DateTimeUtils.formatCurrency(s.monthlyAmount)}/ay',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  )),

              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SavingsScreen(controller: controller),
                  ),
                ),
                icon: const Icon(Icons.savings_outlined),
                label: const Text('Tasarruf analizi'),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48)),
              ),
            ],
          );
        },
      ),
    );
  }

  Map<SubscriptionCategory, double> _groupByCategory(
      List<Subscription> subs) {
    final map = <SubscriptionCategory, double>{};
    for (final s in subs) {
      map[s.category] = (map[s.category] ?? 0) + s.monthlyAmount;
    }
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return Map.fromEntries(sorted);
  }

  Map<BillingCycle, int> _groupByCycle(List<Subscription> subs) {
    final map = <BillingCycle, int>{};
    for (final s in subs) {
      map[s.billingCycle] = (map[s.billingCycle] ?? 0) + 1;
    }
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return Map.fromEntries(sorted);
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 10),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ]),
      ),
    );
  }
}

class _CategoryBar extends StatelessWidget {
  const _CategoryBar({
    required this.label,
    required this.amount,
    required this.percent,
  });

  final String label;
  final double amount;
  final double percent;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            Text(
              '${DateTimeUtils.formatCurrency(amount)}  '
              '(${(percent * 100).toStringAsFixed(0)}%)',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent.clamp(0.0, 1.0),
            minHeight: 8,
            backgroundColor: colors.surfaceContainerHighest,
            valueColor: AlwaysStoppedAnimation(colors.primary),
          ),
        ),
      ]),
    );
  }
}
