import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/domain/money.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../stats/presentation/screens/stats_screen.dart';
import '../../../subscriptions/domain/subscription_models.dart';
import '../../../subscriptions/presentation/screens/add_subscription_screen.dart';
import '../../../subscriptions/presentation/screens/subscription_detail_screen.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_animated_money.dart';
import '../../../../shared/widgets/service_identity.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, this.onViewAllSubscriptions});

  final VoidCallback? onViewAllSubscriptions;

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SubscriptionController>();
    final authUser = context.watch<AuthController>().user;
    final greetingName = authUser?.displayName?.trim().isNotEmpty == true
        ? authUser!.displayName!.trim()
        : authUser?.email.split('@').first;
    final active = controller.active;
    final upcoming = controller.upcomingRenewals;
    final trials = controller.trials;
    final totals = controller.totalsByCurrency;
    final monthChangeLabel = _monthChangeLabel(controller);
    // "Tamamlandı" burada şu anlama gelir: bu takvim ayında en az bir ödeme
    // kaydı (payment_events) girilmiş aktif abonelik. Bu, "bu ay yenilenmesi
    // gereken" aboneliklerin kesin sayısı değil — kullanıcının fiilen ödeme
    // olarak işaretlediği kayıtların basit bir özeti.
    final now = DateTime.now();
    final paidSubscriptionIdsThisMonth = controller.paymentEvents
        .where((e) =>
            e.paidAt.toLocal().year == now.year &&
            e.paidAt.toLocal().month == now.month)
        .map((e) => e.subscriptionId)
        .whereType<String>()
        .toSet();
    final completedThisMonth =
        active.where((s) => paidSubscriptionIdsThisMonth.contains(s.id)).length;

    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        if (controller.isOffline)
          _OfflineBanner(
              lastSyncAt: controller.lastSyncAt,
              pendingCount: controller.pendingMutationCount,
              onRetry: controller.load)
        else if (controller.error != null)
          MaterialBanner(
            content: Text(controller.error!),
            actions: [
              TextButton(
                  onPressed: controller.clearError, child: const Text('Kapat')),
              TextButton(
                  onPressed: controller.load, child: const Text('Tekrar dene')),
            ],
          ),
        Expanded(
          child: RefreshIndicator(
            color: cs.primary,
            backgroundColor: cs.surfaceContainer,
            onRefresh: controller.load,
            child: ListView(
              padding: AppSpacing.screenWithBottomNav,
              children: [
                _GreetingRow(name: greetingName),
                const SizedBox(height: 20),
                _HeroCard(
                  totals: totals,
                  monthChangeLabel: monthChangeLabel,
                  completedThisMonth: completedThisMonth,
                  totalActive: active.length,
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
                const SizedBox(height: 12),
                _StatChipsRow(
                  activeCount: active.length,
                  upcomingCount:
                      upcoming.where((s) => s.daysUntilRenewal <= 7).length,
                  annualLabel: totals.isEmpty
                      ? '₺0 yıllık'
                      : '${DateTimeUtils.formatCurrency(totals.entries.first.value.amount * 12, symbol: totals.entries.first.key)} / yıl',
                ),
                const SizedBox(height: 28),
                if (trials.isNotEmpty) ...[
                  _SectionHeader(
                    title: 'Trial uyarıları',
                    actionLabel: trials.length > 3 ? 'Tümünü gör' : null,
                    onAction: onViewAllSubscriptions,
                  ),
                  const SizedBox(height: 12),
                  _TrialList(
                      trials: trials.take(3).toList(), controller: controller),
                  const SizedBox(height: 28),
                ],
                // S46: tam "Yaklaşan ödemeler" listesi kaldırıldı — o liste
                // zaten Takvim sekmesinde var. Ana sayfada yalnızca en
                // yakın tek ödeme, hızlı erişim kartı olarak kalıyor.
                _SectionHeader(
                  title: 'Sıradaki ödeme',
                  actionLabel:
                      onViewAllSubscriptions != null && upcoming.isNotEmpty
                          ? 'Takvimde gör'
                          : null,
                  onAction: onViewAllSubscriptions,
                ),
                const SizedBox(height: 12),
                if (upcoming.isEmpty)
                  _EmptyRenewalsCard()
                else
                  _NextPaymentCard(
                    subscription: upcoming.first,
                    controller: controller,
                  ),
                if (active.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  // S46: tam kategori listesi kaldırıldı — zaten Stats
                  // sekmesinde ayrıntılı olarak var. Ana sayfada yalnızca
                  // özet bir donut grafik + oraya link.
                  _CategoryDonutCard(
                    active: active,
                    onViewAll: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => StatsScreen(controller: controller),
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  _HealthInsights(active: active, controller: controller),
                ],
                if (controller.savingsEvents.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  _SavingsSummary(controller: controller),
                ],
                if (active.isEmpty) ...[
                  const SizedBox(height: 24),
                  _EmptyDashboardIntro(
                    onAdd: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            AddSubscriptionScreen(controller: controller),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
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
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Greeting ────────────────────────────────────────────────────────────────

class _GreetingRow extends StatelessWidget {
  const _GreetingRow({this.name});

  final String? name;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık'
    ];
    final days = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    final dateStr =
        '${days[now.weekday % 7]}, ${now.day} ${months[now.month - 1]}';

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                (name != null && name!.isNotEmpty)
                    ? 'Merhaba, $name 👋'
                    : 'Merhaba 👋',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                dateStr,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Hero Card ───────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.totals,
    this.monthChangeLabel,
    this.onAnalysisTap,
    this.completedThisMonth = 0,
    this.totalActive = 0,
  });

  final Map<String, Money> totals;
  final String? monthChangeLabel;
  final VoidCallback? onAnalysisTap;
  final int completedThisMonth;
  final int totalActive;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF252A72) : cs.primaryContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? const Color(0xFF7377F5).withValues(alpha: 0.25)
              : cs.outlineVariant,
          width: 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bu ay ödenecek',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            letterSpacing: 0.2,
                          ),
                    ),
                    const SizedBox(height: 6),
                    if (totals.isEmpty)
                      Text(
                        '₺0,00',
                        style:
                            Theme.of(context).textTheme.headlineLarge?.copyWith(
                                  color: cs.onSurface,
                                  fontSize: 36,
                                  fontWeight: FontWeight.w800,
                                ),
                      )
                    else
                      ...totals.entries.map(
                        (e) => AppAnimatedMoney(
                          amount: e.value.amount,
                          symbol: e.key,
                          style: Theme.of(context)
                              .textTheme
                              .headlineLarge
                              ?.copyWith(
                                color: cs.onSurface,
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ),
                  ],
                ),
              ),
              if (totalActive > 0)
                GestureDetector(
                  onTap: onAnalysisTap,
                  child: _MonthProgressRing(
                    completed: completedThisMonth,
                    total: totalActive,
                  ),
                )
              else if (onAnalysisTap != null)
                _AnalysisPill(onTap: onAnalysisTap!),
            ],
          ),
          if (onAnalysisTap != null) ...[
            const SizedBox(height: 10),
            Text(
              'Abonelik maliyetini ve yıllık etkisini incele',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
            ),
          ],
          if (totals.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              totals.entries
                  .map((e) =>
                      '${DateTimeUtils.formatCurrency((e.value * 12).amount, symbol: e.key)}/yıl')
                  .join(' · '),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
            ),
          ],
          if (monthChangeLabel != null) ...[
            const SizedBox(height: 6),
            Text(
              monthChangeLabel!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: monthChangeLabel!.contains('daha')
                        ? const Color(0xFF43D69B)
                        : cs.onSurfaceVariant,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AnalysisPill extends StatelessWidget {
  const _AnalysisPill({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: cs.primary.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: cs.primary.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.trending_up, color: cs.primary, size: 14),
            const SizedBox(width: 4),
            Text(
              'Analiz',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: cs.primary,
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

/// S46: "Tamamlandı" tanımı için bkz. DashboardScreen.build() içindeki
/// completedThisMonth hesaplama yorumu — bu ay ödeme kaydı girilmiş aktif
/// abonelik sayısıdır, "bu ay yenilenmesi gereken toplam" değildir.
class _MonthProgressRing extends StatelessWidget {
  const _MonthProgressRing({required this.completed, required this.total});

  final int completed;
  final int total;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final progress = total == 0 ? 0.0 : completed / total;
    return SizedBox(
      width: 64,
      height: 64,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(64, 64),
            painter: _RingPainter(
              progress: progress,
              color: cs.primary,
              trackColor: cs.primary.withValues(alpha: 0.15),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$completed/$total',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: cs.onSurface,
                    ),
              ),
              Text(
                'ödeme',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 8,
                      color: cs.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.color,
    required this.trackColor,
  });

  final double progress;
  final Color color;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.14;
    final center = size.center(Offset.zero);
    final radius = (size.width - strokeWidth) / 2;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );

    final clamped = progress.clamp(0.0, 1.0);
    if (clamped > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * clamped,
        false,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.color != color ||
      oldDelegate.trackColor != trackColor;
}

String? _monthChangeLabel(SubscriptionController controller) {
  final events = controller.paymentEvents;
  if (events.isEmpty) return null;
  final now = DateTime.now();
  final previous = DateTime(now.year, now.month - 1);
  final currency = events.first.currency;
  double totalFor(DateTime month) => events.where((event) {
        final date = event.paidAt.toLocal();
        return event.currency == currency &&
            date.year == month.year &&
            date.month == month.month;
      }).fold(0, (sum, event) => sum + event.amount);
  final currentTotal = totalFor(now);
  final previousTotal = totalFor(previous);
  if (previousTotal == 0) return null;
  final percent =
      ((currentTotal - previousTotal) / previousTotal * 100).round();
  final direction = percent <= 0 ? 'daha az' : 'daha fazla';
  return 'Geçen aya göre %${percent.abs()} $direction';
}

// ─── Stat Chips ──────────────────────────────────────────────────────────────

class _StatChipsRow extends StatelessWidget {
  const _StatChipsRow({
    required this.activeCount,
    required this.upcomingCount,
    required this.annualLabel,
  });

  final int activeCount;
  final int upcomingCount;
  final String annualLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatChip(
            icon: Icons.refresh_rounded,
            label: '$activeCount aktif abonelik',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatChip(
            icon: Icons.notifications_active_outlined,
            label: '$upcomingCount yenileme bu hafta',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatChip(
            icon: Icons.bar_chart_rounded,
            label: annualLabel,
          ),
        ),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: cs.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section Header ──────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
          ),
        ),
        if (actionLabel != null && onAction != null)
          GestureDetector(
            onTap: onAction,
            child: Text(
              actionLabel!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
      ],
    );
  }
}

// ─── Next Payment Card (S46) ───────────────────────────────────────────────

/// Tam "yaklaşan ödemeler" listesi yerine tek, en yakın ödemeyi vurgulayan
/// bir kart — tam liste zaten Takvim sekmesinde mevcut.
class _NextPaymentCard extends StatelessWidget {
  const _NextPaymentCard(
      {required this.subscription, required this.controller});

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    final isDark = cs.brightness == Brightness.dark;
    final days = subscription.daysUntilRenewal;
    final urgent = days <= 3;

    void openDetail() => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => SubscriptionDetailScreen(
              subscription: subscription,
              controller: controller,
            ),
          ),
        );

    final daysLabel = days < 0 ? '${days.abs()} gün geçti' : '$days gün kaldı';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark
            ? statusColors.warning.withValues(alpha: 0.12)
            : statusColors.warning.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: statusColors.warning.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: openDetail,
            child: Row(
              children: [
                ServiceIdentity(
                  name: subscription.name,
                  category: subscription.category,
                  size: 44,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subscription.name,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${DateTimeUtils.formatDate(subscription.nextRenewalDate)} · $daysLabel',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: urgent ? cs.error : statusColors.warning,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                ),
                Text(
                  DateTimeUtils.formatCurrency(
                    subscription.amount.amount,
                    symbol: subscription.currency,
                  ),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: cs.onSurface,
                      ),
                ),
                const SizedBox(width: 2),
                Icon(Icons.chevron_right_rounded, color: cs.onSurfaceVariant),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
            onPressed: openDetail,
            style: OutlinedButton.styleFrom(
              foregroundColor: statusColors.warning,
              side: BorderSide(
                  color: statusColors.warning.withValues(alpha: 0.4)),
              visualDensity: VisualDensity.compact,
            ),
            icon: const Icon(Icons.notifications_active_outlined, size: 16),
            label: const Text('Hatırlat'),
          ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty Renewals ───────────────────────────────────────────────────────────

class _EmptyRenewalsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: cs.primary.withValues(alpha: 0.1),
              border: Border.all(
                  color: cs.primary.withValues(alpha: 0.2), width: 0.5),
            ),
            child: Icon(Icons.check_circle_outline_rounded,
                size: 26, color: cs.primary),
          ),
          const SizedBox(height: 14),
          Text(
            'Yaklaşan yenileme yok',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Bu hafta ödeme yok.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _HealthInsights extends StatelessWidget {
  const _HealthInsights({required this.active, required this.controller});

  final List<Subscription> active;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final amounts = active.map((s) => s.monthlyAmount.amount).toList()..sort();
    final median = amounts[amounts.length ~/ 2];
    final flagged = active.where((s) {
      final expensive = s.monthlyAmount.amount >= median * 1.5 && median > 0;
      final soon = s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 7;
      return expensive || soon;
    }).toList();
    if (flagged.isEmpty) return const SizedBox.shrink();
    return Card(
      color: const Color(0xFF13251F),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.insights_outlined,
                color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            Text('Bu ayın içgörüsü',
                style: Theme.of(context).textTheme.titleSmall),
          ]),
          const SizedBox(height: 8),
          Text('${flagged.length} aboneliği yenilemeden önce gözden geçir.',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          ...flagged.take(3).map((s) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(s.name),
                subtitle: Text(s.daysUntilRenewal <= 7
                    ? '7 gün içinde yenileniyor'
                    : 'Ortalamanın üzerinde aylık maliyet'),
                trailing: Text(DateTimeUtils.formatCurrency(
                    s.monthlyAmount.amount,
                    symbol: s.currency)),
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                        builder: (_) => SubscriptionDetailScreen(
                            subscription: s, controller: controller))),
              )),
          OutlinedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(
                builder: (_) => SubscriptionDetailScreen(
                  subscription: flagged.first,
                  controller: controller,
                ),
              ),
            ),
            icon: const Icon(Icons.visibility_outlined),
            label: const Text('İncele'),
          ),
        ]),
      ),
    );
  }
}

class _SavingsSummary extends StatelessWidget {
  const _SavingsSummary({required this.controller});

  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final entries = controller.savingsByCurrency.entries.toList();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Gerçekleşen tasarruf',
              style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 6),
          Text('İptal ve duraklatma kararlarının yıllık etkisi',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          ...entries.map((entry) => Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(entry.key),
                  Text(
                      '${DateTimeUtils.formatCurrency(entry.value.amount, symbol: entry.key)}/yıl',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              )),
        ]),
      ),
    );
  }
}

class _EmptyDashboardIntro extends StatelessWidget {
  const _EmptyDashboardIntro({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Dashboard’unu oluşturmaya başla',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
              'Aboneliklerini ekle; aylık maliyetini, yenilemelerini ve trial’larını tek yerde takip et.',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 10),
          TextButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Hemen başla')),
        ],
      ),
    );
  }
}

class _TrialList extends StatelessWidget {
  const _TrialList({required this.trials, required this.controller});

  final List<Subscription> trials;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(18),
          border:
              Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Column(
          children: trials.asMap().entries.map((entry) {
            final sub = entry.value;
            final last = entry.key == trials.length - 1;
            final days = sub.trialEndDate == null
                ? null
                : DateTime(sub.trialEndDate!.year, sub.trialEndDate!.month,
                        sub.trialEndDate!.day)
                    .difference(DateTime(DateTime.now().year,
                        DateTime.now().month, DateTime.now().day))
                    .inDays;
            return InkWell(
              onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                      builder: (_) => SubscriptionDetailScreen(
                          subscription: sub, controller: controller))),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                decoration: last
                    ? null
                    : BoxDecoration(
                        border: Border(
                            bottom: BorderSide(
                                color: Theme.of(context)
                                    .colorScheme
                                    .outlineVariant))),
                child: Row(children: [
                  ServiceIdentity(
                      name: sub.name, category: sub.category, size: 34),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text(sub.name,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        Text(
                            days == null
                                ? 'Trial tarihi eksik'
                                : days <= 0
                                    ? 'Bugün sona eriyor'
                                    : '$days gün sonra sona eriyor',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                    color: days != null && days <= 3
                                        ? Theme.of(context).colorScheme.error
                                        : null)),
                      ])),
                  Text(
                      DateTimeUtils.formatCurrency(
                          sub.trialPriceAfter?.amount ?? sub.amount.amount,
                          symbol: sub.currency),
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ]),
              ),
            );
          }).toList(),
        ),
      );
}

// ─── Category Donut Card (S46) ─────────────────────────────────────────────

/// Tam kategori dökümü yerine özet bir donut grafik + en büyük 2 kategori +
/// Stats sekmesine link — tam liste zaten orada (StatsScreen) hesaplanıyor,
/// burada tekrar üretilmiyor.
class _CategoryDonutCard extends StatelessWidget {
  const _CategoryDonutCard({required this.active, required this.onViewAll});

  final List<Subscription> active;
  final VoidCallback onViewAll;

  // S46 fix: Üretkenlik/Araçlar öncekinde çok soluktu (ACC7FF/FFD1AA) — beyaz
  // kart zemininde donut diliminin "kesilmiş/kaybolmuş" görünmesine yol
  // açıyordu. Dördü de artık benzer doygunlukta, birbirinden net ayrılıyor.
  static const _groupColors = {
    'Eğlence': Color(0xFFFF6B6B),
    'Müzik': Color(0xFF2BB3A3),
    'Üretkenlik': Color(0xFF5B67CA),
    'Araçlar': Color(0xFFF2994A),
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final Map<String, ({double amount, String currency, int count})> groups =
        {};
    for (final sub in active) {
      final g = _group(sub.category);
      final existing = groups[g];
      groups[g] = (
        amount: (existing?.amount ?? 0) + sub.monthlyAmount.amount,
        currency: existing?.currency ?? sub.currency,
        count: (existing?.count ?? 0) + 1,
      );
    }
    if (groups.isEmpty) return const SizedBox.shrink();

    // Donut, tek para birimi varsayarak oran gösterir — karışık para
    // birimi durumunda en çok kullanılanı baz alınır (StatsScreen zaten
    // para birimi bazlı ayrımı tam olarak yapıyor, buradaki grafik sadece
    // görsel bir özet).
    final primaryCurrency = groups.values.first.currency;
    final sameCurrencyEntries = groups.entries
        .where((e) => e.value.currency == primaryCurrency)
        .toList()
      ..sort((a, b) => b.value.amount.compareTo(a.value.amount));
    final total =
        sameCurrencyEntries.fold<double>(0, (sum, e) => sum + e.value.amount);
    final slices = sameCurrencyEntries
        .map((e) => (
              total == 0 ? 0.0 : e.value.amount / total,
              _groupColors[e.key] ?? cs.secondary,
            ))
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: 'Bu ayın görünümü',
          actionLabel: 'Tüm kategoriler',
          onAction: onViewAll,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surfaceContainer,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 84,
                height: 84,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CustomPaint(
                      size: const Size(84, 84),
                      painter: _DonutPainter(
                        slices: slices,
                        trackColor: cs.outlineVariant,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          DateTimeUtils.formatCurrency(total,
                              symbol: primaryCurrency),
                          style: Theme.of(context)
                              .textTheme
                              .labelMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                          textAlign: TextAlign.center,
                        ),
                        Text(
                          'toplam',
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: sameCurrencyEntries.take(3).map((e) {
                    final percent =
                        total == 0 ? 0 : (e.value.amount / total * 100).round();
                    final color = _groupColors[e.key] ?? cs.secondary;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                                color: color, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              e.key,
                              style: Theme.of(context).textTheme.bodySmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '%$percent',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  static String _group(SubscriptionCategory cat) => switch (cat) {
        SubscriptionCategory.streaming ||
        SubscriptionCategory.gaming ||
        SubscriptionCategory.news ||
        SubscriptionCategory.food =>
          'Eğlence',
        SubscriptionCategory.music => 'Müzik',
        SubscriptionCategory.software ||
        SubscriptionCategory.education =>
          'Üretkenlik',
        SubscriptionCategory.cloud ||
        SubscriptionCategory.fitness ||
        SubscriptionCategory.other =>
          'Araçlar',
      };
}

class _DonutPainter extends CustomPainter {
  _DonutPainter({required this.slices, required this.trackColor});

  final List<(double, Color)> slices;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = size.width * 0.22;
    final center = size.center(Offset.zero);
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    var startAngle = -math.pi / 2;
    for (final slice in slices) {
      final sweep = 2 * math.pi * slice.$1;
      if (sweep <= 0) continue;
      canvas.drawArc(
        rect,
        startAngle,
        sweep,
        false,
        Paint()
          ..color = slice.$2
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.butt,
      );
      startAngle += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) =>
      oldDelegate.slices != slices || oldDelegate.trackColor != trackColor;
}

// ─── Offline Banner ───────────────────────────────────────────────────────────

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner(
      {required this.onRetry, this.lastSyncAt, this.pendingCount = 0});
  final VoidCallback onRetry;
  final DateTime? lastSyncAt;
  final int pendingCount;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = cs.brightness == Brightness.dark;
    final base = lastSyncAt == null
        ? 'Çevrimdışı — önbellek gösteriliyor'
        : 'Çevrimdışı — ${_rel(lastSyncAt!)} önce güncellendi';
    final label =
        pendingCount > 0 ? '$base · $pendingCount işlem bekliyor' : base;
    return MaterialBanner(
      backgroundColor: isDark ? const Color(0xFF2A1F00) : cs.tertiaryContainer,
      content: Text(label, style: TextStyle(color: cs.tertiary)),
      actions: [
        TextButton(onPressed: onRetry, child: const Text('Yenile')),
      ],
    );
  }

  static String _rel(DateTime utc) {
    final d = DateTime.now().toUtc().difference(utc);
    if (d.inSeconds < 60) return '${d.inSeconds} sn';
    if (d.inMinutes < 60) return '${d.inMinutes} dk';
    if (d.inHours < 24) return '${d.inHours} sa';
    return '${d.inDays} gün';
  }
}
