import 'package:flutter/material.dart';

import '../../../../app/theme/app_theme.dart';
import '../../../../core/utils/date_time_utils.dart';
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

  Color _brandColor(Subscription sub) {
    final nameKey = sub.name.trim().toLowerCase();
    if (nameKey.contains('netflix')) return const Color(0xFFE50914);
    if (nameKey.contains('spotify')) return const Color(0xFF1DB954);
    if (nameKey.contains('youtube')) return const Color(0xFFFF0033);
    if (nameKey.contains('chatgpt') || nameKey.contains('openai')) {
      return const Color(0xFF10A37F);
    }
    if (nameKey.contains('adobe')) return const Color(0xFFFF0000);
    if (nameKey.contains('icloud') || nameKey.contains('apple')) {
      return const Color(0xFF5AA9FF);
    }
    if (nameKey.contains('google')) return const Color(0xFF4285F4);
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    final brandColor = _brandColor(subscription);
    final daysLeft = subscription.daysUntilRenewal;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
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
                _PaymentMethodSection(subscription: subscription),
                const SizedBox(height: 24),
                _PaymentHistorySection(subscription: subscription),
                const SizedBox(height: 28),
                _ActionButtonsSection(
                  subscription: subscription,
                  onPauseResume: () => subscription.status == SubscriptionStatus.active
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
                '${subscription.name} kalıcı olarak silinecek. Emin misin?'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('İptal')),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: FilledButton.styleFrom(
                    backgroundColor: Theme.of(ctx).colorScheme.error),
                child: const Text('Sil'),
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
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black38,
                    Colors.transparent,
                    AppColors.background,
                  ],
                  stops: [0.0, 0.4, 1.0],
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
                        if (subscription.status == SubscriptionStatus.active) ...[
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
                        if (subscription.status == SubscriptionStatus.paused) ...[
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
                        const PopupMenuItem(
                          value: _Action.delete,
                          child: Row(children: [
                            Icon(Icons.delete_outline, color: AppColors.error),
                            SizedBox(width: 12),
                            Text('Sil', style: TextStyle(color: AppColors.error)),
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
                        color: Colors.white.withValues(alpha: 0.25), width: 1.5),
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
    final statusColor = daysLeft <= 3
        ? AppColors.tertiary
        : (daysLeft <= 7 ? AppColors.warning : AppColors.primary);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 0.5),
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
                        const Text(
                          'SONRAKİ ÖDEME',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.onSurfaceVar,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateTimeUtils.formatDate(subscription.nextRenewalDate),
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: AppColors.onSurface,
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
                          '$daysLeft',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: statusColor,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'GÜN KALDI',
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
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'KATEGORİ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurfaceVar,
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
                        color: AppColors.primary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        Icons.movie_filter_rounded,
                        size: 15,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        subscription.category.label,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
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
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ÖDEME DÖNGÜSÜ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurfaceVar,
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
                        color: AppColors.tertiary.withValues(alpha: 0.15),
                      ),
                      child: const Icon(
                        Icons.update_rounded,
                        size: 15,
                        color: AppColors.tertiary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        subscription.billingCycle.label,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
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
  const _PaymentMethodSection({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'ÖDEME YÖNTEMİ',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.onSurfaceVar,
              letterSpacing: 1.0,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.surfaceHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.credit_card_rounded,
                  color: AppColors.secondary,
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
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subscription.paymentMethod != null
                          ? 'Kayıtlı Ödeme Kartı'
                          : 'Ödeme yöntemi seçilmedi',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.onSurfaceVar,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Değiştir',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
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

// ─── Payment History Section ─────────────────────────────────────────────────

class _PaymentHistorySection extends StatelessWidget {
  const _PaymentHistorySection({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final priceStr = DateTimeUtils.formatCurrency(
      subscription.amount.amount,
      symbol: subscription.currency,
    );

    final now = DateTime.now();
    final prevMonth1 = DateTime(now.year, now.month - 1, subscription.nextRenewalDate.day);
    final prevMonth2 = DateTime(now.year, now.month - 2, subscription.nextRenewalDate.day);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Text(
                'GEÇMİŞ ÖDEMELER',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurfaceVar,
                  letterSpacing: 1.0,
                ),
              ),
            ),
            TextButton(
              onPressed: () {},
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Tümünü gör',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: Column(
            children: [
              _HistoryTile(
                dateStr: DateTimeUtils.formatDate(prevMonth1),
                amountStr: priceStr,
                isFirst: true,
              ),
              const Divider(height: 1, thickness: 0.5, color: AppColors.border),
              _HistoryTile(
                dateStr: DateTimeUtils.formatDate(prevMonth2),
                amountStr: priceStr,
                isFirst: false,
              ),
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
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.success.withValues(alpha: 0.15),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              size: 18,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dateStr,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'ÖDENDİ',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: AppColors.success,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          Text(
            amountStr,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.onSurface,
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
    required this.onPauseResume,
    required this.onArchive,
    required this.onCancel,
    required this.onDelete,
  });

  final Subscription subscription;
  final VoidCallback onPauseResume;
  final VoidCallback onArchive;
  final VoidCallback onCancel;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isPaused = subscription.status == SubscriptionStatus.paused;

    return Column(
      children: [
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
                  backgroundColor: AppColors.surface,
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
                  backgroundColor: AppColors.surface,
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
          icon: const Icon(Icons.cancel_outlined, size: 20, color: AppColors.error),
          label: const Text(
            'Aboneliği İptal Et',
            style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700),
          ),
          style: OutlinedButton.styleFrom(
            backgroundColor: AppColors.error.withValues(alpha: 0.08),
            side: BorderSide(color: AppColors.error.withValues(alpha: 0.3), width: 0.5),
            minimumSize: const Size.fromHeight(50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Sonraki fatura tarihinden 24 saat önce sana hatırlatma bildirimi göndereceğiz.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            color: AppColors.onSurfaceVar,
          ),
        ),
      ],
    );
  }
}
