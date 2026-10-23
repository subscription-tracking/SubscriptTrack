import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/navigation/app_routes.dart';
import '../../../../shared/design/responsive.dart';
import '../../../../shared/widgets/app_confirm_dialog.dart';
import '../../../../shared/widgets/service_identity.dart';
import '../../domain/subscription_models.dart';
import '../subscription_controller.dart';
import '../widgets/detail/detail_action_buttons.dart';
import '../widgets/detail/detail_hero_header.dart';
import '../widgets/detail/detail_payment_card.dart';
import '../widgets/detail/detail_payment_history.dart';
import '../widgets/detail/detail_reminders_section.dart';

class SubscriptionDetailScreen extends StatelessWidget {
  const SubscriptionDetailScreen({
    required this.subscription,
    required this.controller,
    super.key,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  /// Controller'daki güncel kayıt; silinmişse ekranın açıldığı anlık görüntü.
  Subscription _latest() =>
      controller.allItems.where((s) => s.id == subscription.id).firstOrNull ??
      subscription;

  // Düzenleme, ödeme veya durum değişikliği controller'a yansıyınca ekran
  // eski anlık görüntüde kalmasın diye controller dinlenir.
  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: controller,
        builder: (context, _) => _buildScreen(context, _latest()),
      );

  Widget _buildScreen(BuildContext context, Subscription subscription) {
    final cs = Theme.of(context).colorScheme;
    final brandColor = ServiceIdentity.colorFor(
        context, subscription.name, subscription.category);
    final daysLeft = subscription.daysUntilRenewal;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      body: ResponsiveCenter(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _hero(context, subscription, brandColor),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  DetailNextPaymentCard(
                    subscription: subscription,
                    daysLeft: daysLeft,
                  ),
                  const SizedBox(height: 16),
                  DetailGridCategoryAndCycle(subscription: subscription),
                  const SizedBox(height: 24),
                  DetailPaymentMethodSection(
                    subscription: subscription,
                    onChange: () => _navigateToEdit(context),
                  ),
                  const SizedBox(height: 24),
                  DetailReminderSection(
                    subscription: subscription,
                    onEdit: () => _navigateToEdit(context),
                  ),
                  const SizedBox(height: 24),
                  DetailPaymentHistorySection(
                    subscription: subscription,
                    controller: controller,
                  ),
                  const SizedBox(height: 28),
                  _actions(context, subscription),
                  const SizedBox(height: 32),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actions(BuildContext context, Subscription subscription) {
    return DetailActionButtonsSection(
      subscription: subscription,
      onRenewed: () async {
        await controller.markPaidAndRenewed(subscription.id);
        if (context.mounted) Navigator.pop(context);
      },
      onPauseResume: () => subscription.status == SubscriptionStatus.active
          ? _handleAction(context, DetailMenuAction.pause)
          : _handleAction(context, DetailMenuAction.resume),
      onArchive: () => _handleAction(context, DetailMenuAction.archive),
      onCancel: () => _handleAction(context, DetailMenuAction.cancel),
      onDelete: () => _handleAction(context, DetailMenuAction.delete),
    );
  }

  Widget _hero(BuildContext context, Subscription subscription, Color color) {
    return DetailHeroHeader(
      subscription: subscription,
      brandColor: color,
      onBack: () => Navigator.pop(context),
      onEdit: () => _navigateToEdit(context),
      onMenuAction: (action) => _handleAction(context, action),
    );
  }

  void _navigateToEdit(BuildContext context) {
    context.push(AppRoutes.editSubscription(subscription.id));
  }

  /// Menü eyleminin çalıştıracağı işlem; silme onaylanmadıysa `null`.
  Future<Future<void> Function()?> _runnerFor(
    BuildContext ctx,
    DetailMenuAction action,
  ) async {
    final id = subscription.id;
    return switch (action) {
      DetailMenuAction.pause => () => controller.pause(id),
      DetailMenuAction.resume => () => controller.resume(id),
      DetailMenuAction.cancel => () => controller.cancel(id),
      DetailMenuAction.archive => () => controller.archive(id),
      DetailMenuAction.delete =>
        (await _confirmDelete(ctx)) ? () => controller.delete(id) : null,
    };
  }

  Future<void> _handleAction(BuildContext ctx, DetailMenuAction action) async {
    if (action == DetailMenuAction.resume &&
        _latest().status == SubscriptionStatus.cancelled) {
      final confirmed = await AppConfirmDialog.show(
        context: ctx,
        title: 'Aboneliği yeniden etkinleştir',
        message: 'Yenileme takibi yeniden başlasın mı? Geçmiş tasarruf kaydı korunur.',
        confirmLabel: 'Yeniden etkinleştir',
        cancelLabel: 'Vazgeç',
      );
      if (confirmed != true || !ctx.mounted) return;
    }
    final run = await _runnerFor(ctx, action);
    if (run == null || !ctx.mounted) return;
    final messenger = ScaffoldMessenger.of(ctx);
    await run();
    if (action == DetailMenuAction.archive) _showArchivedUndo(messenger);
    if (ctx.mounted) Navigator.pop(ctx);
  }

  void _showArchivedUndo(ScaffoldMessengerState messenger) {
    messenger.showSnackBar(SnackBar(
      content: Text('${subscription.name} arşivlendi.'),
      action: SnackBarAction(
        label: 'Geri al',
        onPressed: () => controller.restore(subscription.id),
      ),
    ));
  }

  Future<bool> _confirmDelete(BuildContext ctx) async {
    final confirm = await AppConfirmDialog.show(
      context: ctx,
      title: 'Aboneliği sil',
      message:
          '${subscription.name} kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?',
      confirmLabel: 'Kalıcı olarak sil',
      cancelLabel: 'İptal',
      isDestructive: true,
    );
    return confirm == true;
  }
}
