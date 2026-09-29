import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/design/app_tokens.dart';
import '../../../../shared/widgets/app_empty_state.dart';
import '../../../../shared/widgets/async_state_view.dart';
import '../../../subscriptions/presentation/subscription_controller.dart';
import '../../domain/stats_view_model.dart';
import '../widgets/action_cards.dart';
import '../widgets/category_breakdown_card.dart';
import '../widgets/currency_selector.dart';
import '../widgets/hero_spending_card.dart';
import '../widgets/insights_card.dart';
import '../widgets/trend_card.dart';

/// SubscriptTrack İstatistikler & Analiz Ekranı
///
/// Koyu tema, net görsel hiyerarşi, aylık gider tahmini,
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

  void _open(String route) => unawaited(context.push(route));

  @override
  Widget build(BuildContext context) {
    final content = ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final controller = widget.controller;
        final model = StatsViewModel.build(
          totals: controller.totalsByCurrency,
          active: controller.active,
          paymentEvents: controller.paymentEvents,
          selectedCurrency: _selectedCurrency,
          months: _months,
        );
        return AsyncStateView(
          loading: controller.loading,
          error: controller.error,
          onRetry: controller.load,
          isOffline: controller.isOffline,
          lastSyncAt: controller.lastSyncAt,
          pendingCount: controller.pendingMutationCount,
          isEmpty: controller.active.isEmpty,
          empty: _StateMessage(
            onAddSubscription: () => _open(AppRoutes.addSubscription),
          ),
          child: model == null
              ? const _StateMessage()
              : RefreshIndicator(
                  onRefresh: controller.load,
                  child: _buildBody(controller, model),
                ),
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

  Widget _buildBody(SubscriptionController controller, StatsViewModel model) {
    final highest = model.highestSubscription;
    return ListView(
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
        if (model.availableCurrencies.length > 1) ...[
          CurrencySelector(
            currencies: model.availableCurrencies,
            selected: model.currency,
            onChanged: (c) => setState(() => _selectedCurrency = c),
          ),
          const SizedBox(height: 16),
        ],
        HeroSpendingCard(
          monthly: model.monthly,
          yearly: model.yearly,
          currency: model.currency,
          activeCount: model.activeCount,
          trend: model.trend,
          hasPaymentHistory: model.hasPaymentHistory,
        ),
        const SizedBox(height: 20),
        TrendCard(
          trend: model.trend,
          currency: model.currency,
          months: _months,
          hasPaymentHistory: model.hasPaymentHistory,
          monthlyAmount: model.monthly,
          onMonthsChanged: (val) => setState(() => _months = val),
        ),
        const SizedBox(height: 20),
        if (highest != null || model.dueSoon.isNotEmpty) ...[
          InsightsCard(
            highestSub: highest,
            totalMonthly: model.monthly,
            currency: model.currency,
            dueSubscriptions: model.dueSoon,
            onReviewDue: () => _open(AppRoutes.savings),
          ),
          const SizedBox(height: 20),
        ],
        CategoryBreakdownCard(
          entries: model.categories,
          total: model.monthly,
          currency: model.currency,
        ),
        const SizedBox(height: 20),
        ActionCards(
          onSavingsTap: () => _open(AppRoutes.savings),
          onPaymentHistoryTap: () => _open(AppRoutes.paymentHistory),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({this.onAddSubscription});

  final VoidCallback? onAddSubscription;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: AppSpacing.screen,
          child: AppEmptyState(
            icon: Icons.insights_outlined,
            title: 'Henüz analiz yok',
            description:
                'Aylık abonelik giderlerini görmek için ilk aboneliğini ekle.',
            actionLabel: onAddSubscription != null ? 'Abonelik ekle' : null,
            onAction: onAddSubscription,
          ),
        ),
      );
}
