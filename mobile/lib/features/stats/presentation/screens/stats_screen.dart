import 'package:flutter/material.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/app_offline_banner.dart';
import '../../../savings/presentation/screens/savings_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../subscriptions/presentation/screens/add_subscription_screen.dart';
import 'payment_history_screen.dart';

/// SubscriptTrack İstatistikler & Analiz Ekranı
///
/// Lüks koyu tema (OLED), net görsel hiyerarşi, bütçe projeksiyonu,
/// kategori kırılımı ve akıllı içgörüler (Insights) sunar.
class StatsScreen extends StatefulWidget {
  const StatsScreen({
    required this.controller,
    this.embedded = false,
    super.key,
  });

  final SubscriptionController controller;
  final bool embedded;

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  int _months = 6;
  String? _selectedCurrency;

  @override
  Widget build(BuildContext context) {
    final content = ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final controller = widget.controller;
        Widget body;

        if (controller.loading && controller.active.isEmpty) {
          body = const Center(child: CircularProgressIndicator());
        } else if (controller.error != null) {
          body = _StateMessage(
            error: controller.error,
            onRetry: controller.load,
          );
        } else if (controller.active.isEmpty) {
          body = _StateMessage(
            onAddSubscription: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => AddSubscriptionScreen(controller: controller),
              ),
            ),
          );
        } else {
          final totals = controller.totalsByCurrency;
          if (totals.isEmpty) {
            body = const _StateMessage();
          } else {
            // Para birimi seçimi (varsayılan: en yüksek tutarlı veya ilk)
            final availableCurrencies = totals.keys.toList();
            final currency = (_selectedCurrency != null &&
                    availableCurrencies.contains(_selectedCurrency))
                ? _selectedCurrency!
                : availableCurrencies.first;

            final monthly = totals[currency] ?? Money.zero;
            final yearly = monthly * 12;

            // Trend verisi
            final trend = _trend(controller, currency, months: _months);
            final hasPaymentHistory = controller.paymentEvents
                .any((event) => event.currency == currency);

            // Kategori dağılımı
            final categories = _categories(controller.active, currency);

            // Yaklaşan acil yenilemeler (önümüzdeki 7 gün)
            final due = ([
              ...controller.active
            ]..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate)))
                .where((s) =>
                    s.nextRenewalDate.difference(DateTime.now()).inDays <= 7 &&
                    s.nextRenewalDate.difference(DateTime.now()).inDays >= 0)
                .take(3)
                .toList();

            // En yüksek harcama kalemi
            final highestSub = ([
              ...controller.active.where((s) => s.currency == currency)
            ]..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount)))
                .firstOrNull;

            body = RefreshIndicator(
              onRefresh: controller.load,
              child: ListView(
                padding: widget.embedded
                    ? AppSpacing.screenWithBottomNav(context)
                    : const EdgeInsets.fromLTRB(
                        AppSpacing.lg,
                        AppSpacing.md,
                        AppSpacing.lg,
                        AppSpacing.xl,
                      ),
                children: [
                  const SizedBox(height: 8),

                  // Çoklu para birimi seçici (varsa)
                  if (availableCurrencies.length > 1) ...[
                    _CurrencySelector(
                      currencies: availableCurrencies,
                      selected: currency,
                      onChanged: (c) => setState(() => _selectedCurrency = c),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 1. Hero Finansal Genel Bakış Kartı
                  _HeroSpendingCard(
                    monthly: monthly,
                    yearly: yearly,
                    currency: currency,
                    activeCount: controller.active
                        .where((s) => s.currency == currency)
                        .length,
                    trend: trend,
                    hasPaymentHistory: hasPaymentHistory,
                  ),
                  const SizedBox(height: 20),

                  // 2. Harcama Trendi & Grafik Kartı
                  _TrendCard(
                    trend: trend,
                    currency: currency,
                    months: _months,
                    hasPaymentHistory: hasPaymentHistory,
                    monthlyAmount: monthly,
                    onMonthsChanged: (val) => setState(() => _months = val),
                  ),
                  const SizedBox(height: 20),

                  // 3. Akıllı İçgörü: En Büyük Gider & Yaklaşan
                  if (highestSub != null || due.isNotEmpty) ...[
                    _InsightsCard(
                      highestSub: highestSub,
                      totalMonthly: monthly,
                      currency: currency,
                      dueSubscriptions: due,
                      onReviewDue: () => Navigator.push(
                        context,
                        MaterialPageRoute<void>(
                          builder: (_) => SavingsScreen(controller: controller),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // 4. Kategori Harcama Dağılımı
                  _CategoryBreakdownCard(
                    entries: categories.entries.toList(),
                    total: monthly,
                    currency: currency,
                  ),
                  const SizedBox(height: 20),

                  // 5. Hızlı Aksiyon Kartları (Tasarruf & Ödeme Geçmişi)
                  _ActionCards(
                    onSavingsTap: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => SavingsScreen(controller: controller),
                      ),
                    ),
                    onPaymentHistoryTap: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            PaymentHistoryScreen(controller: controller),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          }
        }

        return Column(
          children: [
            if (controller.isOffline)
              AppOfflineBanner(
                lastSyncAt: controller.lastSyncAt,
                pendingCount: controller.pendingMutationCount,
                onRetry: controller.load,
              ),
            Expanded(child: body),
          ],
        );
      },
    );

    // AppShell owns the app bar, bottom navigation and outer Scaffold. The
    // embedded tab returns only its content to avoid a nested Scaffold.
    if (widget.embedded) return content;

    return Scaffold(
      appBar: AppBar(
        title: const Text('İstatistikler'),
        centerTitle: false,
      ),
      body: content,
    );
  }
}

// ── 1. Hero Finansal Genel Bakış Kartı ───────────────────────────────────────

class _HeroSpendingCard extends StatelessWidget {
  const _HeroSpendingCard({
    required this.monthly,
    required this.yearly,
    required this.currency,
    required this.activeCount,
    required this.trend,
    required this.hasPaymentHistory,
  });

  final Money monthly;
  final Money yearly;
  final String currency;
  final int activeCount;
  final List<int> trend;
  final bool hasPaymentHistory;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    int diff = 0;
    bool down = true;
    if (trend.length >= 2) {
      diff = monthly.minorUnits - trend[trend.length - 2];
      down = diff <= 0;
    }
    final diffMoney = Money.parse(
        '${diff.abs() ~/ 100}.${(diff.abs() % 100).toString().padLeft(2, '0')}');

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'AYLIK HARCAMA TAAHHÜDÜ',
                  style: textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurfaceVariant,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  '$activeCount Aktif',
                  style: textTheme.labelSmall?.copyWith(
                    color: cs.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            DateTimeUtils.formatCurrency(monthly.amount, symbol: currency),
            style: textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: hasPaymentHistory
                      ? (down
                          ? const Color(0xFF76B995).withValues(alpha: 0.15)
                          : cs.error.withValues(alpha: 0.15))
                      : cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      hasPaymentHistory
                          ? (down
                              ? Icons.south_east_rounded
                              : Icons.north_east_rounded)
                          : Icons.calendar_today_rounded,
                      size: 14,
                      color: hasPaymentHistory
                          ? (down ? const Color(0xFF76B995) : cs.error)
                          : cs.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      hasPaymentHistory
                          ? (diff == 0
                              ? 'Aynı seviyede'
                              : '${DateTimeUtils.formatCurrency(diffMoney.amount, symbol: currency)} ${down ? 'azalış' : 'artış'}')
                          : 'Planlanan gider',
                      style: textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: hasPaymentHistory
                            ? (down ? const Color(0xFF76B995) : cs.error)
                            : cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Yıllık ${DateTimeUtils.formatCurrency(yearly.amount, symbol: currency)}',
                  style: textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── 2. Harcama Trendi & Grafik Kartı ─────────────────────────────────────────

class _TrendCard extends StatelessWidget {
  const _TrendCard({
    required this.trend,
    required this.currency,
    required this.months,
    required this.hasPaymentHistory,
    required this.monthlyAmount,
    required this.onMonthsChanged,
  });

  final List<int> trend;
  final String currency;
  final int months;
  final bool hasPaymentHistory;
  final Money monthlyAmount;
  final ValueChanged<int> onMonthsChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final displayValues = hasPaymentHistory
        ? trend
        : List.generate(months, (index) => monthlyAmount.minorUnits);

    final maxVal = displayValues.fold<int>(
      1,
      (max, val) => val > max ? val : max,
    );

    final now = DateTime.now();

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Harcama Trendi',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasPaymentHistory
                          ? 'Gerçekleşen harcama geçmişi'
                          : 'Aylık taahhüt projeksiyonu',
                      style: textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(100),
                ),
                padding: const EdgeInsets.all(3),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [3, 6, 12].map((m) {
                    final selected = m == months;
                    return GestureDetector(
                      onTap: () => onMonthsChanged(m),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: selected ? cs.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          '$m Ay',
                          style: textTheme.labelSmall?.copyWith(
                            color:
                                selected ? cs.onPrimary : cs.onSurfaceVariant,
                            fontWeight:
                                selected ? FontWeight.w800 : FontWeight.w600,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 26),
          SizedBox(
            height: 140,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: displayValues.indexed.map((entry) {
                final index = entry.$1;
                final val = entry.$2;
                final isCurrentMonth = index == displayValues.length - 1;
                final monthDate = DateTime(
                    now.year, now.month - (displayValues.length - 1 - index));
                final ratio = (val / maxVal).clamp(0.08, 1.0);

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (isCurrentMonth)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text(
                              DateTimeUtils.formatCurrency(
                                Money.parse(
                                  '${val ~/ 100}.${(val % 100).toString().padLeft(2, '0')}',
                                ).amount,
                                symbol: '',
                              ).trim(),
                              style: textTheme.labelSmall?.copyWith(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: cs.primary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        Expanded(
                          child: Align(
                            alignment: Alignment.bottomCenter,
                            child: FractionallySizedBox(
                              heightFactor: ratio,
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: isCurrentMonth
                                      ? cs.primary
                                      : (hasPaymentHistory
                                          ? cs.primary.withValues(alpha: 0.35)
                                          : cs.surfaceContainerHighest),
                                  borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _monthLabel(monthDate),
                          style: textTheme.labelSmall?.copyWith(
                            color: isCurrentMonth
                                ? cs.primary
                                : cs.onSurfaceVariant,
                            fontWeight: isCurrentMonth
                                ? FontWeight.w800
                                : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          if (!hasPaymentHistory) ...[
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      size: 16, color: cs.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Gerçek ödeme geçmişi için abonelik detayından ödeme kaydı ekleyin.',
                      style: textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── 3. Akıllı İçgörüler (Insights) Kartı ──────────────────────────────────────

class _InsightsCard extends StatelessWidget {
  const _InsightsCard({
    required this.highestSub,
    required this.totalMonthly,
    required this.currency,
    required this.dueSubscriptions,
    required this.onReviewDue,
  });

  final Subscription? highestSub;
  final Money totalMonthly;
  final String currency;
  final List<Subscription> dueSubscriptions;
  final VoidCallback onReviewDue;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    int sharePct = 0;
    if (highestSub != null && totalMonthly.minorUnits > 0) {
      sharePct =
          ((highestSub!.monthlyAmount.minorUnits / totalMonthly.minorUnits) *
                  100)
              .round();
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: cs.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.auto_awesome_rounded,
                  color: cs.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Akıllı İçgörüler',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // En Yüksek Harcama Kalemi
          if (highestSub != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cs.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: cs.outlineVariant.withValues(alpha: 0.4),
                  width: 0.6,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: cs.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        highestSub!.name.isNotEmpty
                            ? highestSub!.name[0].toUpperCase()
                            : '?',
                        style: TextStyle(
                          color: cs.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'En Yüksek Gider: ${highestSub!.name}',
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Aylık bütçenin %$sharePct payını oluşturuyor.',
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    DateTimeUtils.formatCurrency(
                      highestSub!.monthlyAmount.amount,
                      symbol: currency,
                    ),
                    style: textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Yaklaşan Ödemeler Uyarısı
          if (dueSubscriptions.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.25),
                  width: 0.6,
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: Color(0xFFF59E0B),
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${dueSubscriptions.length} abonelik 7 gün içinde yenilenecek',
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          dueSubscriptions.map((e) => e.name).join(', '),
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonal(
                    onPressed: onReviewDue,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 40),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text('İncele'),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── 4. Kategori Harcama Dağılımı Kartı ──────────────────────────────────────

class _CategoryBreakdownCard extends StatelessWidget {
  const _CategoryBreakdownCard({
    required this.entries,
    required this.total,
    required this.currency,
  });

  final List<MapEntry<SubscriptionCategory, Money>> entries;
  final Money total;
  final String currency;

  static const _palette = [
    Color(0xFF8B82F6), // Indigo / Violet
    Color(0xFF10B981), // Emerald
    Color(0xFF3B82F6), // Blue
    Color(0xFFF59E0B), // Amber
    Color(0xFFEC4899), // Pink
    Color(0xFF06B6D4), // Cyan
    Color(0xFF84CC16), // Lime
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cs.outlineVariant.withValues(alpha: 0.6),
          width: 0.8,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Kategori Dağılımı',
                  style: textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${entries.length} Kategori',
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          ...entries.indexed.map((entry) {
            final index = entry.$1;
            final item = entry.$2;
            final category = item.key;
            final amount = item.value;
            final pct = total.minorUnits == 0
                ? 0.0
                : (amount.minorUnits / total.minorUnits);
            final color = _palette[index % _palette.length];

            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          category.label,
                          style: textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Text(
                        DateTimeUtils.formatCurrency(
                          amount.amount,
                          symbol: currency,
                        ),
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 40,
                        child: Text(
                          '%${(pct * 100).round()}',
                          textAlign: TextAlign.end,
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: LinearProgressIndicator(
                      value: pct.clamp(0.01, 1.0),
                      minHeight: 6,
                      color: color,
                      backgroundColor: cs.surfaceContainerHighest,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ── 5. Hızlı Aksiyon Kartları ───────────────────────────────────────────────

class _ActionCards extends StatelessWidget {
  const _ActionCards({
    required this.onSavingsTap,
    required this.onPaymentHistoryTap,
  });

  final VoidCallback onSavingsTap;
  final VoidCallback onPaymentHistoryTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(
          child: _ActionTile(
            icon: Icons.trending_down_rounded,
            iconColor: const Color(0xFF10B981),
            title: 'Tasarruf Analizi',
            subtitle: 'Optimizasyon',
            onTap: onSavingsTap,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ActionTile(
            icon: Icons.receipt_long_rounded,
            iconColor: cs.primary,
            title: 'Ödeme Geçmişi',
            subtitle: 'Kayıtları yönet',
            onTap: onPaymentHistoryTap,
          ),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Material(
      color: cs.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: cs.outlineVariant.withValues(alpha: 0.6),
              width: 0.8,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Çoklu Para Birimi Seçici ────────────────────────────────────────────────

class _CurrencySelector extends StatelessWidget {
  const _CurrencySelector({
    required this.currencies,
    required this.selected,
    required this.onChanged,
  });

  final List<String> currencies;
  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: currencies.map((curr) {
          final isSelected = curr == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(curr),
              selected: isSelected,
              onSelected: (_) => onChanged(curr),
              selectedColor: cs.primary.withValues(alpha: 0.2),
              side: BorderSide(
                color: isSelected
                    ? cs.primary
                    : cs.outlineVariant.withValues(alpha: 0.5),
                width: 0.8,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Boş ve Hata Durumu ──────────────────────────────────────────────────────

class _StateMessage extends StatelessWidget {
  const _StateMessage({this.error, this.onRetry, this.onAddSubscription});

  final String? error;
  final VoidCallback? onRetry;
  final VoidCallback? onAddSubscription;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: AppSpacing.screen,
          child: AppEmptyState(
            icon: error == null ? Icons.insights_outlined : Icons.error_outline,
            title: error == null ? 'Henüz analiz yok' : 'Veriler yüklenemedi',
            description: error ??
                'Harcama analizini ve projeksiyonları görmek için ilk aboneliğini ekle.',
            actionLabel: error != null
                ? 'Tekrar dene'
                : onAddSubscription != null
                    ? 'Abonelik ekle'
                    : null,
            onAction: error != null ? onRetry : onAddSubscription,
          ),
        ),
      );
}

// ── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

Map<SubscriptionCategory, Money> _categories(
  List<Subscription> list,
  String currency,
) {
  final map = <SubscriptionCategory, Money>{};
  for (final s in list.where((s) => s.currency == currency)) {
    map[s.category] = (map[s.category] ?? Money.zero) + s.monthlyAmount;
  }
  final entries = map.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  return Map.fromEntries(entries);
}

List<int> _trend(
  SubscriptionController c,
  String currency, {
  int months = 6,
}) {
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

String _monthLabel(DateTime d) {
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
    'Ara',
  ];
  return m[d.month - 1];
}
