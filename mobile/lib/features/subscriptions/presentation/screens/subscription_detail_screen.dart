import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart' show AppStatusColorsX;
import '../../../../core/utils/date_time_utils.dart';
import '../../../../shared/design/responsive.dart';
import '../../../../shared/widgets/app_animated_money.dart';
import '../../../../shared/widgets/service_identity.dart';
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
    final cs = Theme.of(context).colorScheme;
    // S45: ServiceIdentity ile aynı marka-renk eşleşmesini kullanır (eskiden
    // burada daha dar, .contains tabanlı ayrı bir kopyası vardı) — hero
    // arka planı artık avatar ikonunun rengiyle her zaman tutarlı.
    final brandColor = ServiceIdentity.colorFor(
        context, subscription.name, subscription.category);
    final daysLeft = subscription.daysUntilRenewal;

    return Scaffold(
      backgroundColor: cs.surfaceContainerLowest,
      body: ResponsiveCenter(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _HeroHeader(
                subscription: subscription,
                brandColor: brandColor,
                onBack: () => Navigator.pop(context),
                onEdit: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => EditSubscriptionScreen(
                      subscription: subscription,
                      controller: controller,
                    ),
                  ),
                ),
                onMenuAction: (action) => _handleAction(context, action),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _NextPaymentCard(
                    subscription: subscription,
                    daysLeft: daysLeft,
                  ),
                  const SizedBox(height: 16),
                  _GridCategoryAndCycle(subscription: subscription),
                  const SizedBox(height: 24),
                  _PaymentMethodSection(
                    subscription: subscription,
                    onChange: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => EditSubscriptionScreen(
                          subscription: subscription,
                          controller: controller,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _ReminderSection(
                    subscription: subscription,
                    onEdit: () => Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (_) => EditSubscriptionScreen(
                          subscription: subscription,
                          controller: controller,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _PaymentHistorySection(
                    subscription: subscription,
                    controller: controller,
                  ),
                  const SizedBox(height: 28),
                  _ActionButtonsSection(
                    subscription: subscription,
                    onRenewed: () async {
                      await controller.markPaidAndRenewed(subscription.id);
                      if (context.mounted) Navigator.pop(context);
                    },
                    onPauseResume: () =>
                        subscription.status == SubscriptionStatus.active
                            ? _handleAction(context, _Action.pause)
                            : _handleAction(context, _Action.resume),
                    onArchive: () => _handleAction(context, _Action.archive),
                    onCancel: () => _handleAction(context, _Action.cancel),
                    onDelete: () => _handleAction(context, _Action.delete),
                  ),
                  const SizedBox(height: 32),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(BuildContext ctx, _Action action) async {
    switch (action) {
      case _Action.pause:
        await controller.pause(subscription.id);
        if (ctx.mounted) Navigator.pop(ctx);
      case _Action.resume:
        await controller.resume(subscription.id);
        if (ctx.mounted) Navigator.pop(ctx);
      case _Action.cancel:
        await controller.cancel(subscription.id);
        if (ctx.mounted) Navigator.pop(ctx);
      case _Action.archive:
        await controller.archive(subscription.id);
        if (ctx.mounted) Navigator.pop(ctx);
      case _Action.delete:
        final confirm = await showDialog<bool>(
          context: ctx,
          builder: (_) => AlertDialog(
            title: const Text('Aboneliği sil'),
            content: Text(
                '${subscription.name} kalıcı olarak silinecek. Bu işlem geri '
                'alınamaz. Emin misin?'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('İptal')),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: FilledButton.styleFrom(
                    backgroundColor: Theme.of(ctx).colorScheme.error),
                child: const Text('Kalıcı olarak sil'),
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

enum _Action { pause, resume, cancel, archive, delete }

// ─── Hero Header Component ───────────────────────────────────────────────────

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({
    required this.subscription,
    required this.brandColor,
    required this.onBack,
    required this.onEdit,
    required this.onMenuAction,
  });

  final Subscription subscription;
  final Color brandColor;
  final VoidCallback onBack;
  final VoidCallback onEdit;
  final ValueChanged<_Action> onMenuAction;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      height: 270 + topPadding,
      width: double.infinity,
      decoration: BoxDecoration(
        color: brandColor,
      ),
      child: Stack(
        children: [
          // Gradient and Glow overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black38,
                    Colors.transparent,
                    cs.surfaceContainerLowest,
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
            ),
          ),
          Positioned(
            right: -40,
            top: -40,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.12),
              ),
            ),
          ),
          // Top Navigation Controls
          Positioned(
            top: topPadding + 8,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _GlassIconButton(
                  icon: Icons.arrow_back_ios_new_rounded,
                  onTap: onBack,
                ),
                Row(
                  children: [
                    _GlassIconButton(
                      icon: Icons.edit_note_rounded,
                      onTap: onEdit,
                    ),
                    const SizedBox(width: 8),
                    PopupMenuButton<_Action>(
                      onSelected: onMenuAction,
                      icon: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black.withValues(alpha: 0.28),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: const Icon(Icons.more_vert_rounded,
                            color: Colors.white, size: 20),
                      ),
                      itemBuilder: (_) => [
                        if (subscription.status ==
                            SubscriptionStatus.active) ...[
                          const PopupMenuItem(
                            value: _Action.pause,
                            child: Row(children: [
                              Icon(Icons.pause_circle_outline),
                              SizedBox(width: 12),
                              Text('Duraklat'),
                            ]),
                          ),
                          const PopupMenuItem(
                            value: _Action.cancel,
                            child: Row(children: [
                              Icon(Icons.cancel_outlined),
                              SizedBox(width: 12),
                              Text('İptal Et'),
                            ]),
                          ),
                          const PopupMenuItem(
                            value: _Action.archive,
                            child: Row(children: [
                              Icon(Icons.archive_outlined),
                              SizedBox(width: 12),
                              Text('Arşivle'),
                            ]),
                          ),
                        ],
                        if (subscription.status ==
                            SubscriptionStatus.paused) ...[
                          const PopupMenuItem(
                            value: _Action.resume,
                            child: Row(children: [
                              Icon(Icons.play_circle_outline),
                              SizedBox(width: 12),
                              Text('Devam Ettir'),
                            ]),
                          ),
                          const PopupMenuItem(
                            value: _Action.archive,
                            child: Row(children: [
                              Icon(Icons.archive_outlined),
                              SizedBox(width: 12),
                              Text('Arşivle'),
                            ]),
                          ),
                        ],
                        PopupMenuItem(
                          value: _Action.delete,
                          child: Row(children: [
                            Icon(Icons.delete_outline, color: cs.error),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text('Sil',
                                  style: TextStyle(color: cs.error)),
                            ),
                          ]),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Brand Info Card & Title
          Positioned(
            left: 20,
            right: 20,
            bottom: 16,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D1017),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                        color: Colors.white.withValues(alpha: 0.25),
                        width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Center(
                    child: ServiceIdentity(
                      name: subscription.name,
                      category: subscription.category,
                      size: 44,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        subscription.name,
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '${subscription.billingCycle.label} • ',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withValues(alpha: 0.82),
                            ),
                          ),
                          AppAnimatedMoney(
                            amount: subscription.amount.amount,
                            symbol: subscription.currency,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withValues(alpha: 0.82),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(100),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.black.withValues(alpha: 0.28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
      ),
    );
  }
}

// ─── Next Payment Card ──────────────────────────────────────────────────────

class _NextPaymentCard extends StatelessWidget {
  const _NextPaymentCard({
    required this.subscription,
    required this.daysLeft,
  });

  final Subscription subscription;
  final int daysLeft;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    final isOverdue = daysLeft < 0;
    final statusColor = isOverdue
        ? cs.error
        : daysLeft <= 3
            ? cs.tertiary
            : (daysLeft <= 7 ? statusColors.warning : cs.primary);

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cs.outlineVariant, width: 0.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: 4,
              child: Container(color: statusColor),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SONRAKİ ÖDEME',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: cs.onSurfaceVariant,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateTimeUtils.formatDate(
                              subscription.nextRenewalDate),
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: cs.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: statusColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${isOverdue ? daysLeft.abs() : daysLeft}',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: statusColor,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isOverdue ? 'GÜN GECİKTİ' : 'GÜN KALDI',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: statusColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── 2-Column Grid Category & Cycle ─────────────────────────────────────────

class _GridCategoryAndCycle extends StatelessWidget {
  const _GridCategoryAndCycle({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: cs.outlineVariant, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'KATEGORİ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurfaceVariant,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: cs.primary.withValues(alpha: 0.15),
                      ),
                      child: Icon(
                        Icons.movie_filter_rounded,
                        size: 15,
                        color: cs.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        subscription.category.label,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: cs.outlineVariant, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ÖDEME DÖNGÜSÜ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurfaceVariant,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: cs.tertiary.withValues(alpha: 0.15),
                      ),
                      child: Icon(
                        Icons.update_rounded,
                        size: 15,
                        color: cs.tertiary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        subscription.billingCycle.label,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Payment Method Section ──────────────────────────────────────────────────

class _PaymentMethodSection extends StatelessWidget {
  const _PaymentMethodSection({
    required this.subscription,
    required this.onChange,
  });

  final Subscription subscription;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'ÖDEME YÖNTEMİ',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: cs.onSurfaceVariant,
              letterSpacing: 1.0,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.credit_card_rounded,
                  color: cs.secondary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subscription.paymentMethod ?? 'Belirtilmedi',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subscription.paymentMethod != null
                          ? 'Kayıtlı Ödeme Kartı'
                          : 'Ödeme yöntemi seçilmedi',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onChange,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Değiştir',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: cs.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Reminder Section ─────────────────────────────────────────────────────

/// S43: abonelik bazlı hatırlatma kurallarını (Subscription.notificationRules)
/// gösterir. Salt-okunur önizleme + düzenleme ekranına yönlendirme; asıl
/// kural yönetimi (çoklu seçim, özel gün ekleme) SubscriptionForm'da yapılır.
class _ReminderSection extends StatelessWidget {
  const _ReminderSection({
    required this.subscription,
    required this.onEdit,
  });

  final Subscription subscription;
  final VoidCallback onEdit;

  String _label(int daysBefore) =>
      daysBefore == 0 ? 'Aynı gün' : '$daysBefore gün önce';

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final rules = subscription.notificationRules
        .where((r) => r.enabled)
        .toList()
      ..sort((a, b) => a.daysBefore.compareTo(b.daysBefore));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'HATIRLATMALAR',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurfaceVariant,
                  letterSpacing: 1.0,
                ),
              ),
              TextButton(
                onPressed: onEdit,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Düzenle',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: cs.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: rules.isEmpty
              ? Text('Bu abonelik için hatırlatma kapalı.',
                  style: TextStyle(color: cs.onSurfaceVariant))
              : Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: rules
                      .map((r) => Chip(
                            label: Text(_label(r.daysBefore)),
                            visualDensity: VisualDensity.compact,
                            backgroundColor: cs.primary.withValues(alpha: 0.1),
                            side: BorderSide.none,
                            labelStyle: TextStyle(
                              color: cs.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ))
                      .toList(),
                ),
        ),
      ],
    );
  }
}

// ─── Payment History Section ─────────────────────────────────────────────────

class _PaymentHistorySection extends StatelessWidget {
  const _PaymentHistorySection({
    required this.subscription,
    required this.controller,
  });

  final Subscription subscription;
  final SubscriptionController controller;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final payments = controller.paymentEvents
        .where((event) => event.subscriptionId == subscription.id)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Text(
                'GEÇMİŞ ÖDEMELER',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurfaceVariant,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            TextButton(
              onPressed: payments.isNotEmpty
                  ? () => showDialog<void>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text('Geçmiş ödemeler'),
                          content: SizedBox(
                            width: double.maxFinite,
                            child: ListView.builder(
                              shrinkWrap: true,
                              itemCount: payments.length,
                              itemBuilder: (_, i) => ListTile(
                                title: Text(DateTimeUtils.formatDate(
                                    payments[i].paidAt)),
                                trailing: Text(DateTimeUtils.formatCurrency(
                                  payments[i].amount.amount,
                                  symbol: payments[i].currency,
                                )),
                              ),
                            ),
                          ),
                        ),
                      )
                  : null,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'Tümünü gör',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: cs.outlineVariant, width: 0.5),
          ),
          child: payments.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Henüz ödeme geçmişi yok',
                      style: TextStyle(color: cs.onSurfaceVariant)),
                )
              : Column(
                  children: [
                    for (var i = 0; i < payments.length && i < 2; i++) ...[
                      if (i > 0)
                        Divider(
                            height: 1,
                            thickness: 0.5,
                            color: cs.outlineVariant),
                      _HistoryTile(
                        dateStr: DateTimeUtils.formatDate(payments[i].paidAt),
                        amountStr: DateTimeUtils.formatCurrency(
                          payments[i].amount.amount,
                          symbol: payments[i].currency,
                        ),
                        isFirst: i == 0,
                      ),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.dateStr,
    required this.amountStr,
    required this.isFirst,
  });

  final String dateStr;
  final String amountStr;
  final bool isFirst;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: statusColors.success.withValues(alpha: 0.15),
            ),
            child: Icon(
              Icons.check_circle_rounded,
              size: 18,
              color: statusColors.success,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'ÖDENDİ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: statusColors.success,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          Text(
            amountStr,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: cs.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Action Buttons Section ──────────────────────────────────────────────────

class _ActionButtonsSection extends StatelessWidget {
  const _ActionButtonsSection({
    required this.subscription,
    required this.onRenewed,
    required this.onPauseResume,
    required this.onArchive,
    required this.onCancel,
    required this.onDelete,
  });

  final Subscription subscription;
  final VoidCallback onRenewed;
  final VoidCallback onPauseResume;
  final VoidCallback onArchive;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isPaused = subscription.status == SubscriptionStatus.paused;
    final isDue = subscription.status == SubscriptionStatus.active &&
        subscription.daysUntilRenewal <= 0;

    return Column(
      children: [
        if (isDue) ...[
          FilledButton.icon(
            onPressed: onRenewed,
            icon: const Icon(Icons.check_circle_outline, size: 18),
            label: const Text('Ödendi ve yenilendi'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onPauseResume,
                icon: Icon(
                  isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                  size: 18,
                ),
                label: Text(isPaused ? 'Devam Ettir' : 'Duraklat'),
                style: OutlinedButton.styleFrom(
                  backgroundColor: cs.surface,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onArchive,
                icon: const Icon(Icons.archive_outlined, size: 18),
                label: const Text('Arşivle'),
                style: OutlinedButton.styleFrom(
                  backgroundColor: cs.surface,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: onCancel,
          icon: Icon(Icons.cancel_outlined, size: 20, color: cs.error),
          label: Text(
            'Aboneliği İptal Et',
            style: TextStyle(color: cs.error, fontWeight: FontWeight.w700),
          ),
          style: OutlinedButton.styleFrom(
            backgroundColor: cs.error.withValues(alpha: 0.08),
            side:
                BorderSide(color: cs.error.withValues(alpha: 0.3), width: 0.5),
            minimumSize: const Size.fromHeight(50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ],
    );
  }
}
