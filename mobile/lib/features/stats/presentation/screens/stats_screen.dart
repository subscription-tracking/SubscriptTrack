import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../savings/presentation/screens/savings_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_empty_state.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({
    required this.controller,
    this.embedded = false,
    super.key,
  });

  final SubscriptionController controller;

  /// true when shown as a bottom-nav tab (shared TopBar already provides
  /// the app bar); false when pushed as its own route.
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: embedded ? null : AppBar(title: const Text('Harcama analizi')),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          if (controller.loading && controller.active.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (controller.error != null) {
            return Center(
              child: Padding(
                padding: AppSpacing.screen,
                child: AppEmptyState(
                  icon: Icons.error_outline,
                  title: 'Veriler yüklenemedi',
                  description: controller.error!,
                  actionLabel: 'Tekrar dene',
                  onAction: controller.load,
                ),
              ),
            );
          }

          final active = controller.active;

          if (active.isEmpty) {
            return const Center(
              child: Padding(
                padding: AppSpacing.screen,
                child: AppEmptyState(
                  icon: Icons.insights_outlined,
                  title: 'Henüz analiz yok',
                  description:
                      'Harcama analizini görmek için ilk aboneliğini ekle.',
                ),
              ),
            );
          }

          final byCurrency = controller.totalsByCurrency;
          final byCategory = _groupByCategory(active);
          final byCycle = _groupByCycle(active);
          final mostExpensive = [...active]
            ..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount));

          // Single-currency view: pick the primary currency for averages.
          final primaryCurrency = byCurrency.keys.first;
          final primaryMonthly = byCurrency[primaryCurrency]!;
          final mixedCurrencies = byCurrency.length > 1;

          return RefreshIndicator(
            onRefresh: controller.load,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xxl),
              children: [
                // Özet kartlar — her para birimi için ayrı satır
                if (mixedCurrencies)
                  ...byCurrency.entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(children: [
                          Expanded(
                            child: _StatCard(
                              label: '${e.key} aylık',
                              value: DateTimeUtils.formatCurrency(
                                  e.value.amount,
                                  symbol: e.key),
                              icon: Icons.calendar_month_outlined,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              label: '${e.key} yıllık',
                              value: DateTimeUtils.formatCurrency(
                                  (e.value * 12).amount,
                                  symbol: e.key),
                              icon: Icons.insights_outlined,
                              color: Theme.of(context).colorScheme.secondary,
                            ),
                          ),
                        ]),
                      ))
                else
                  Row(children: [
                    Expanded(
                      child: _StatCard(
                        label: 'Aylık toplam',
                        value: DateTimeUtils.formatCurrency(
                            primaryMonthly.amount,
                            symbol: primaryCurrency),
                        icon: Icons.calendar_month_outlined,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        label: 'Yıllık toplam',
                        value: DateTimeUtils.formatCurrency(
                            (primaryMonthly * 12).amount,
                            symbol: primaryCurrency),
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
                    child: mixedCurrencies
                        ? _StatCard(
                            label: 'Para birimi',
                            value: byCurrency.keys.join(' + '),
                            icon: Icons.currency_exchange,
                            color: Theme.of(context).colorScheme.error,
                          )
                        : _StatCard(
                            label: 'Abonelik başı ort.',
                            value: DateTimeUtils.formatCurrency(
                                (primaryMonthly / active.length).amount,
                                symbol: primaryCurrency),
                            icon: Icons.calculate_outlined,
                            color: Theme.of(context).colorScheme.error,
                          ),
                  ),
                ]),

                const SizedBox(height: 24),

                if (controller.paymentEvents.isNotEmpty) ...[
                  _PaymentTrend(controller: controller),
                  const SizedBox(height: 24),
                ],

                // Kategori dağılımı
                Text('Kategoriye göre',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ...byCategory.entries.map((e) {
                  // Yüzde: sadece aynı para birimindeki kayıtlar için hesapla
                  final currTotal = byCurrency[e.key.$2];
                  final pct = (currTotal != null && currTotal.minorUnits > 0)
                      ? e.value.amount / currTotal.amount
                      : 0.0;
                  return _CategoryBar(
                    label: e.key.$1.label,
                    amount: e.value,
                    currency: e.key.$2,
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
                              DateTimeUtils.formatCurrency(s.amount.amount,
                                  symbol: s.currency),
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '${DateTimeUtils.formatCurrency(s.monthlyAmount.amount, symbol: s.currency)}/ay',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    )),

                const SizedBox(height: 24),
                Semantics(
                  label: 'Tasarruf analizi sayfasına git',
                  button: true,
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => SavingsScreen(controller: controller),
                      ),
                    ),
                    icon: const Icon(Icons.savings_outlined),
                    label: const Text('Tasarruf analizi'),
                    style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Returns category → Money grouped by (category, currency) pairs.
  Map<(SubscriptionCategory, String), Money> _groupByCategory(
      List<Subscription> subs) {
    final map = <(SubscriptionCategory, String), Money>{};
    for (final s in subs) {
      final key = (s.category, s.currency);
      map[key] = (map[key] ?? Money.zero) + s.monthlyAmount;
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

class _PaymentTrend extends StatelessWidget {
  const _PaymentTrend({required this.controller});
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final currencies =
        controller.paymentEvents.map((e) => e.currency).toSet().toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Son 6 ay ödeme trendi',
          style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 12),
      ...currencies.map((currency) {
        final values = List<double>.generate(6, (i) {
          final month = DateTime(now.year, now.month - (5 - i));
          return controller.paymentEvents.where((e) {
            final d = e.paidAt.toLocal();
            return e.currency == currency &&
                d.year == month.year &&
                d.month == month.month;
          }).fold(0.0, (sum, e) => sum + e.amount);
        });
        final max = values.fold(0.0, (a, b) => a > b ? a : b);
        return Card(
            child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(currency,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: values.asMap().entries.map((entry) {
                            final height = max == 0
                                ? 4.0
                                : (entry.value / max * 72).clamp(4.0, 72.0);
                            final month =
                                DateTime(now.year, now.month - (5 - entry.key));
                            return Expanded(
                                child: Column(children: [
                              SizedBox(
                                  height: 78,
                                  child: Align(
                                      alignment: Alignment.bottomCenter,
                                      child: Container(
                                          height: height,
                                          width: 18,
                                          decoration: BoxDecoration(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .primary,
                                              borderRadius:
                                                  BorderRadius.circular(4))))),
                              const SizedBox(height: 4),
                              Text('${month.month}.',
                                  style:
                                      Theme.of(context).textTheme.labelSmall),
                            ]));
                          }).toList()),
                    ])));
      }),
    ]);
  }
}

class _CategoryBar extends StatelessWidget {
  const _CategoryBar({
    required this.label,
    required this.amount,
    required this.currency,
    required this.percent,
  });

  final String label;
  final Money amount;
  final String currency;
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
              '${DateTimeUtils.formatCurrency(amount.amount, symbol: currency)}  '
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
