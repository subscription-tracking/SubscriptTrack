import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../savings/presentation/screens/savings_screen.dart';
import 'payment_history_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';

class StatsScreen extends StatefulWidget {
  const StatsScreen(
      {required this.controller, this.embedded = false, super.key});
  final SubscriptionController controller;
  final bool embedded;

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  int _months = 6;

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: widget.embedded ? null : AppBar(title: const Text('İstatistikler')),
        body: ListenableBuilder(
          listenable: widget.controller,
          builder: (context, _) {
            final controller = widget.controller;
            if (controller.loading && controller.active.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }
            if (controller.error != null) {
              return _StateMessage(
                  error: controller.error, onRetry: controller.load);
            }
            if (controller.active.isEmpty) {
              return const _StateMessage();
            }
            final totals = controller.totalsByCurrency;
            final currency = totals.keys.first;
            final monthly = totals[currency]!;
            final trend = _trend(controller, currency, months: _months);
            final hasPaymentHistory = controller.paymentEvents
                .any((event) => event.currency == currency);
            final categories = _categories(controller.active, currency);
            final due = ([
              ...controller.active
            ]..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate)))
                .where((s) =>
                    s.nextRenewalDate.difference(DateTime.now()).inDays <= 7)
                .take(2)
                .toList();
            return RefreshIndicator(
              onRefresh: controller.load,
              child: ListView(
                  padding: widget.embedded
                      ? AppSpacing.screenWithBottomNav(context)
                      : const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md,
                          AppSpacing.lg, AppSpacing.xl),
                  children: [
                    const SizedBox(height: 16),
                    _Summary(
                        monthly: monthly,
                        currency: currency,
                        trend: trend,
                        hasPaymentHistory: hasPaymentHistory),
                    if (totals.length > 1)
                      Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(
                              '${totals.keys.join(', ')} tutarları ayrı hesaplanır.',
                              style: Theme.of(context).textTheme.bodySmall)),
                    const SizedBox(height: 24),
                    _Trend(
                        trend: trend,
                        currency: currency,
                        hasPaymentHistory: hasPaymentHistory,
                        months: _months,
                        onMonthsChanged: (value) => setState(() => _months = value)),
                    const SizedBox(height: 24),
                    _Review(
                        items: due,
                        currency: currency,
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                                builder: (_) =>
                                    SavingsScreen(controller: controller)))),
                    const SizedBox(height: 24),
                    Text('Kategoriler',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    _Categories(
                        entries: categories.entries.take(3).toList(),
                        total: monthly,
                        currency: currency),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                        onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                                builder: (_) =>
                                    SavingsScreen(controller: controller))),
                        icon: const Icon(Icons.trending_down_rounded),
                        label: const Text('Tasarruf analizine git')),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                        onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => PaymentHistoryScreen(controller: controller))),
                        icon: const Icon(Icons.receipt_long_outlined),
                        label: const Text('Ödeme geçmişini yönet')),
                  ]),
            );
          },
        ),
      );
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({this.error, this.onRetry});
  final String? error;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
          padding: AppSpacing.screen,
          child: AppEmptyState(
              icon:
                  error == null ? Icons.insights_outlined : Icons.error_outline,
              title: error == null ? 'Henüz analiz yok' : 'Veriler yüklenemedi',
              description: error ??
                  'Harcama analizini görmek için ilk aboneliğini ekle.',
              actionLabel: error == null ? null : 'Tekrar dene',
              onAction: onRetry)));
}

class _Summary extends StatelessWidget {
  const _Summary(
      {required this.monthly,
      required this.currency,
      required this.trend,
      required this.hasPaymentHistory});
  final Money monthly;
  final String currency;
  final List<int> trend;
  final bool hasPaymentHistory;
  @override
  Widget build(BuildContext context) {
    final diff = monthly.minorUnits - trend[trend.length - 2];
    final down = diff <= 0;
    final color =
        down ? const Color(0xFF76B995) : Theme.of(context).colorScheme.error;
    final change = Money.parse(
        '${diff.abs() ~/ 100}.${(diff.abs() % 100).toString().padLeft(2, '0')}');
    return Card(
        child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text('Bu ay',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(
                        DateTimeUtils.formatCurrency(monthly.amount,
                            symbol: currency),
                        style: Theme.of(context)
                            .textTheme
                            .displaySmall
                            ?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    if (hasPaymentHistory)
                      Row(children: [
                        Icon(down ? Icons.south_east : Icons.north_east,
                            color: color, size: 18),
                        const SizedBox(width: 6),
                        Expanded(
                            child: Text(
                                diff == 0
                                    ? 'Geçen ayla aynı'
                                    : 'Geçen aya göre ${DateTimeUtils.formatCurrency(change.amount, symbol: currency)} ${down ? 'daha az' : 'daha fazla'}',
                                style: TextStyle(color: color)))
                      ])
                    else
                      Text(
                          'Gerçek harcama karşılaştırması için ödeme kaydı ekle.',
                          style: Theme.of(context).textTheme.bodySmall)
                  ])),
              const SizedBox(width: 12),
              SizedBox(width: 96, height: 58, child: _Sparkline(values: trend))
            ])));
  }
}

class _Trend extends StatelessWidget {
  const _Trend(
      {required this.trend,
      required this.currency,
      required this.hasPaymentHistory,
      required this.months,
      required this.onMonthsChanged});
  final List<int> trend;
  final String currency;
  final bool hasPaymentHistory;
  final int months;
  final ValueChanged<int> onMonthsChanged;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(20),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Harcama trendi',
                style: Theme.of(context).textTheme.titleLarge),
            Row(children: [
              Expanded(child: Text('Son $months ay · $currency',
                  style: Theme.of(context).textTheme.bodySmall)),
              DropdownButton<int>(
                value: months,
                underline: const SizedBox.shrink(),
                items: const [3, 6, 12].map((m) => DropdownMenuItem(
                    value: m, child: Text('$m ay'))).toList(),
                onChanged: (value) { if (value != null) onMonthsChanged(value); },
              ),
            ]),
            const SizedBox(height: 20),
            if (hasPaymentHistory)
              SizedBox(height: 145, child: _Bars(values: trend))
            else
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 28),
                child: Center(child: Text('Henüz gerçek ödeme geçmişi yok.')),
              )
          ])));
}

class _Review extends StatelessWidget {
  const _Review(
      {required this.items, required this.currency, required this.onTap});
  final List<Subscription> items;
  final String currency;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            Row(children: [
              Icon(Icons.auto_graph_rounded,
                  color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(
                        items.isEmpty
                            ? 'Yaklaşan yenileme yok'
                            : '${items.length} aboneliği gözden geçir',
                        style: Theme.of(context).textTheme.titleMedium),
                    Text(
                        items.isEmpty
                            ? 'Önümüzdeki 7 gün için aksiyon gerekmiyor.'
                            : 'Önümüzdeki 7 günde yenilenecek',
                        style: Theme.of(context).textTheme.bodySmall)
                  ])),
              TextButton(onPressed: onTap, child: const Text('İncele'))
            ]),
            if (items.isNotEmpty) const Divider(),
            ...items.map((s) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(s.name),
                trailing: Text(
                    DateTimeUtils.formatCurrency(s.monthlyAmount.amount,
                        symbol: currency),
                    style: const TextStyle(fontWeight: FontWeight.bold)))),
          ])));
}

class _Categories extends StatelessWidget {
  const _Categories(
      {required this.entries, required this.total, required this.currency});
  final List<MapEntry<SubscriptionCategory, Money>> entries;
  final Money total;
  final String currency;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
              children: entries.indexed.map((e) {
            final pct = total.minorUnits == 0
                ? 0.0
                : e.$2.value.minorUnits / total.minorUnits;
            final color = _colors[e.$1 % _colors.length];
            return Padding(
                padding: const EdgeInsets.only(bottom: 15),
                child: Column(children: [
                  Row(children: [
                    Container(
                        width: 9,
                        height: 9,
                        decoration: BoxDecoration(
                            color: color, shape: BoxShape.circle)),
                    const SizedBox(width: 9),
                    Expanded(child: Text(e.$2.key.label)),
                    Text(DateTimeUtils.formatCurrency(e.$2.value.amount,
                        symbol: currency)),
                    const SizedBox(width: 8),
                    Text('%${(pct * 100).round()}',
                        style: Theme.of(context).textTheme.bodySmall)
                  ]),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                      value: pct.clamp(0, 1),
                      minHeight: 7,
                      color: color,
                      backgroundColor:
                          Theme.of(context).colorScheme.surfaceContainerHighest)
                ]));
          }).toList())));
}

class _Bars extends StatelessWidget {
  const _Bars({required this.values});
  final List<int> values;
  @override
  Widget build(BuildContext context) {
    final max = values.reduce((a, b) => a > b ? a : b);
    final now = DateTime.now();
    return Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: values.indexed.map((e) {
          final isLast = e.$1 == values.length - 1;
          final month =
              DateTime(now.year, now.month - (values.length - 1 - e.$1));
          return Expanded(
              child:
                  Column(mainAxisAlignment: MainAxisAlignment.end, children: [
            Container(
                width: 22,
                height: 96 * (max == 0 ? .08 : e.$2 / max).clamp(.08, 1),
                decoration: BoxDecoration(
                    color: isLast
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 9),
            Text(_month(month), style: Theme.of(context).textTheme.labelSmall)
          ]));
        }).toList());
  }
}

class _Sparkline extends StatelessWidget {
  const _Sparkline({required this.values});
  final List<int> values;
  @override
  Widget build(BuildContext context) => CustomPaint(
      painter:
          _SparklinePainter(values, Theme.of(context).colorScheme.primary));
}

class _SparklinePainter extends CustomPainter {
  const _SparklinePainter(this.values, this.color);
  final List<int> values;
  final Color color;
  @override
  void paint(Canvas c, Size s) {
    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);
    final range = max - min;
    final path = Path();
    for (var i = 0; i < values.length; i++) {
      final x = i * s.width / (values.length - 1);
      final y = range == 0
          ? s.height / 2
          : s.height - ((values[i] - min) / range * (s.height - 10)) - 5;
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    c.drawPath(
        path,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5);
  }

  @override
  bool shouldRepaint(covariant _SparklinePainter old) =>
      old.values != values || old.color != color;
}

Map<SubscriptionCategory, Money> _categories(
    List<Subscription> list, String currency) {
  final map = <SubscriptionCategory, Money>{};
  for (final s in list.where((s) => s.currency == currency)) {
    map[s.category] = (map[s.category] ?? Money.zero) + s.monthlyAmount;
  }
  final entries = map.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  return Map.fromEntries(entries);
}

List<int> _trend(SubscriptionController c, String currency, {int months = 6}) {
  final now = DateTime.now();
  return List.generate(months, (i) {
    final d = DateTime(now.year, now.month - (months - 1 - i));
    final paid = c.paymentEvents.where((e) {
      final at = e.paidAt.toLocal();
      return e.currency == currency && at.year == d.year && at.month == d.month;
    }).fold(0, (sum, e) => sum + e.amount.minorUnits);
    return paid;
  });
}

String _month(DateTime d) {
  const m = [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara'
  ];
  return m[d.month - 1];
}

const _colors = [Color(0xFF8B82F6), Color(0xFF76B995), Color(0xFF62A8FF)];
