import 'package:flutter/material.dart';
import '../../../domain/subscription_models.dart';
import '../../../../../shared/widgets/app_animated_money.dart';
import '../../../../../shared/widgets/service_identity.dart';

enum DetailMenuAction { pause, resume, cancel, archive, delete }

class DetailHeroHeader extends StatelessWidget {
  const DetailHeroHeader({
    required this.subscription,
    required this.brandColor,
    required this.onBack,
    required this.onEdit,
    required this.onMenuAction,
    super.key,
  });

  final Subscription subscription;
  final Color brandColor;
  final VoidCallback onBack;
  final VoidCallback onEdit;
  final ValueChanged<DetailMenuAction> onMenuAction;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      height: 270 + topPadding,
      width: double.infinity,
      decoration: BoxDecoration(color: brandColor),
      child: Stack(
        children: [
          const _Backdrop(),
          Positioned(
            top: topPadding + 8,
            left: 16,
            right: 16,
            child: _TopControls(
              status: subscription.status,
              onBack: onBack,
              onEdit: onEdit,
              onMenuAction: onMenuAction,
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 16,
            child: _BrandInfo(subscription: subscription),
          ),
        ],
      ),
    );
  }
}

/// Üstten koyulaşan gradyan ve sağ üstteki ışık halkası.
class _Backdrop extends StatelessWidget {
  const _Backdrop();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Stack(
      children: [
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
      ],
    );
  }
}

class _TopControls extends StatelessWidget {
  const _TopControls({
    required this.status,
    required this.onBack,
    required this.onEdit,
    required this.onMenuAction,
  });

  final SubscriptionStatus status;
  final VoidCallback onBack;
  final VoidCallback onEdit;
  final ValueChanged<DetailMenuAction> onMenuAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        DetailGlassIconButton(
          icon: Icons.arrow_back_ios_new_rounded,
          onTap: onBack,
        ),
        Row(
          children: [
            DetailGlassIconButton(
              icon: Icons.edit_note_rounded,
              onTap: onEdit,
            ),
            const SizedBox(width: 8),
            PopupMenuButton<DetailMenuAction>(
              onSelected: onMenuAction,
              icon: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withValues(alpha: 0.28),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.15)),
                ),
                child: const Icon(Icons.more_vert_rounded,
                    color: Colors.white, size: 20),
              ),
              itemBuilder: _menuItems,
            ),
          ],
        ),
      ],
    );
  }

  List<PopupMenuEntry<DetailMenuAction>> _menuItems(BuildContext context) {
    final error = Theme.of(context).colorScheme.error;
    return [
      if (status == SubscriptionStatus.active) ...[
        _item(DetailMenuAction.pause, Icons.pause_circle_outline, 'Duraklat'),
        _item(DetailMenuAction.cancel, Icons.cancel_outlined, 'İptal Et'),
        _item(DetailMenuAction.archive, Icons.archive_outlined, 'Arşivle'),
      ],
      if (status == SubscriptionStatus.paused) ...[
        _item(
            DetailMenuAction.resume, Icons.play_circle_outline, 'Devam Ettir'),
        _item(DetailMenuAction.archive, Icons.archive_outlined, 'Arşivle'),
      ],
      _item(DetailMenuAction.delete, Icons.delete_outline, 'Sil', color: error),
    ];
  }

  PopupMenuItem<DetailMenuAction> _item(
    DetailMenuAction value,
    IconData icon,
    String label, {
    Color? color,
  }) {
    return PopupMenuItem(
      value: value,
      child: Row(children: [
        Icon(icon, color: color),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: TextStyle(color: color))),
      ]),
    );
  }
}

class _BrandInfo extends StatelessWidget {
  const _BrandInfo({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final detailStyle = TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: Colors.white.withValues(alpha: 0.82),
    );
    return Row(
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
                  Text('${subscription.billingCycle.label} • ',
                      style: detailStyle),
                  AppAnimatedMoney(
                    amount: subscription.amount.amount,
                    symbol: subscription.currency,
                    style: detailStyle,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class DetailGlassIconButton extends StatelessWidget {
  const DetailGlassIconButton({
    required this.icon,
    required this.onTap,
    super.key,
  });

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
