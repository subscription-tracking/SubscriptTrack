import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/domain/money.dart';
import '../../../../core/navigation/app_routes.dart';
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_offline_banner.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../widgets/dashboard_category_donut.dart';
import '../widgets/dashboard_hero_card.dart';
import '../widgets/dashboard_quick_actions.dart';
import '../widgets/dashboard_stat_chips.dart';
import '../widgets/dashboard_upcoming_section.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({
    super.key,
    this.onViewAllSubscriptions,
    this.onOpenStats,
  });

  final VoidCallback? onViewAllSubscriptions;

  /// Switches to the navbar's İstatistikler tab. When not supplied (e.g. in
  /// a test that renders DashboardScreen on its own, without AppShell),
  /// falls back to pushing StatsScreen as its own route.
  final VoidCallback? onOpenStats;

  void _openStats(BuildContext context, SubscriptionController controller) {
    if (onOpenStats != null) {
      onOpenStats!();
      return;
    }
    context.push(AppRoutes.stats);
  }

  static int _completedThisMonth(SubscriptionController controller) {
    final now = DateTime.now();
    final paidIds = controller.paymentEvents
        .where((e) =>
            e.paidAt.toLocal().year == now.year &&
            e.paidAt.toLocal().month == now.month)
        .map((e) => e.subscriptionId)
        .whereType<String>()
        .toSet();
    return controller.active.where((s) => paidIds.contains(s.id)).length;
  }

  static String _annualLabel(Map<String, Money> totals) {
    if (totals.isEmpty) return 'Yıllık: ₺0';
    final first = totals.entries.first;
    return '${DateTimeUtils.formatCurrency(first.value.amount * 12, symbol: first.key)} / yıl';
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<SubscriptionController>();
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        AppStatusBanner(
          isOffline: controller.isOffline,
          error: controller.error,
          lastSyncAt: controller.lastSyncAt,
          pendingCount: controller.pendingMutationCount,
          onRetry: controller.load,
          onDismissError: controller.clearError,
        ),
        Expanded(
          child: RefreshIndicator(
            color: cs.primary,
            backgroundColor: cs.surfaceContainer,
            onRefresh: controller.load,
            child: ListView(
              padding: AppSpacing.screenWithBottomNav(context),
              children: [
                ..._summary(context, controller),
                ..._renewals(controller),
                ..._overview(context, controller),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Hero kart ve istatistik çipleri.
  List<Widget> _summary(
    BuildContext context,
    SubscriptionController controller,
  ) {
    final active = controller.active;
    final totals = controller.totalsByCurrency;
    final upcomingSoon =
        controller.upcomingRenewals.where((s) => s.daysUntilRenewal <= 7);
    return [
      DashboardHeroCard(
        totals: totals,
        monthChangeLabel: DashboardHeroCard.calculateMonthChange(controller),
        // "Tamamlandı" burada şu anlama gelir: bu takvim ayında en az bir
        // ödeme kaydı (payment_events) girilmiş aktif abonelik. Bu, "bu ay
        // yenilenmesi gereken" aboneliklerin kesin sayısı değil — kullanıcının
        // fiilen ödeme olarak işaretlediği kayıtların basit bir özeti.
        completedThisMonth: _completedThisMonth(controller),
        totalActive: active.length,
        onAnalysisTap:
            active.isEmpty ? null : () => _openStats(context, controller),
      ),
      const SizedBox(height: 12),
      DashboardStatChipsRow(
        activeCount: active.length,
        upcomingCount: upcomingSoon.length,
        annualLabel: _annualLabel(totals),
      ),
      const SizedBox(height: 28),
    ];
  }

  /// Deneme hatırlatmaları ve sıradaki ödeme.
  List<Widget> _renewals(SubscriptionController controller) {
    final trials = controller.trials;
    final upcoming = controller.upcomingRenewals;
    return [
      if (trials.isNotEmpty) ...[
        DashboardSectionHeader(
          title: 'Deneme hatırlatmaları',
          actionLabel: trials.length > 3 ? 'Tümünü gör' : null,
          onAction: onViewAllSubscriptions,
        ),
        const SizedBox(height: 12),
        DashboardTrialList(
            trials: trials.take(3).toList(), controller: controller),
        const SizedBox(height: 28),
      ],
      // S46: tam "Yaklaşan ödemeler" listesi kaldırıldı — o liste
      // zaten Takvim sekmesinde var. Ana sayfada yalnızca en
      // yakın tek ödeme, hızlı erişim kartı olarak kalıyor.
      DashboardSectionHeader(
        title: 'Sıradaki ödeme',
        actionLabel: onViewAllSubscriptions != null && upcoming.isNotEmpty
            ? 'Takvimde gör'
            : null,
        onAction: onViewAllSubscriptions,
      ),
      const SizedBox(height: 12),
      if (upcoming.isEmpty)
        const DashboardEmptyRenewalsCard()
      else
        DashboardNextPaymentCard(
          subscription: upcoming.first,
          controller: controller,
        ),
    ];
  }

  /// Kategori özeti, hızlı eylemler, tasarruf özeti ve boş durum.
  List<Widget> _overview(
    BuildContext context,
    SubscriptionController controller,
  ) {
    final active = controller.active;
    return [
      if (active.isNotEmpty) ...[
        const SizedBox(height: 28),
        // S46: tam kategori listesi kaldırıldı — zaten Stats
        // sekmesinde ayrıntılı olarak var. Ana sayfada yalnızca
        // özet bir donut grafik + oraya link.
        DashboardCategoryDonutCard(
          active: active,
          onViewAll: () => _openStats(context, controller),
        ),
        const SizedBox(height: 28),
        DashboardQuickActionsRow(
          onAdd: () => context.push(AppRoutes.addSubscription),
          onCalendar: onViewAllSubscriptions,
          onStats: () => _openStats(context, controller),
        ),
      ],
      if (controller.savingsEvents.isNotEmpty) ...[
        const SizedBox(height: 28),
        DashboardSavingsSummary(controller: controller),
      ],
      if (active.isEmpty) ...[
        const SizedBox(height: 24),
        const _FirstSubscriptionPrompt(),
      ],
    ];
  }
}

// Çevrimdışı şeridi veya hata bandı; ikisi de yoksa boş.
class _FirstSubscriptionPrompt extends StatelessWidget {
  const _FirstSubscriptionPrompt();

  @override
  Widget build(BuildContext context) {
    void add() => context.push(AppRoutes.addSubscription);
    return Column(
      children: [
        DashboardEmptyIntro(onAdd: add),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: add,
            icon: const Icon(Icons.add),
            label: const Text('İlk aboneliğini ekle'),
          ),
        ),
      ],
    );
  }
}
