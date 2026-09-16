import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

class SubscriptionStatusChip extends StatelessWidget {
  const SubscriptionStatusChip({
    required this.status,
    this.daysUntilRenewal,
    super.key,
  });

  final SubscriptionStatus status;
  final int? daysUntilRenewal;

  @override
  Widget build(BuildContext context) {
    final state = _state;
    return Semantics(
      label: state.label,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: state.color.withValues(alpha: .14),
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: state.color.withValues(alpha: .28)),
        ),
        child: Text(state.label,
            style: TextStyle(
                color: state.color, fontWeight: FontWeight.w700, fontSize: 11)),
      ),
    );
  }

  ({String label, Color color}) get _state {
    if (status == SubscriptionStatus.active && daysUntilRenewal != null) {
      if (daysUntilRenewal! <= 0) {
        return (label: 'Bugün yenileniyor', color: AppColors.error);
      }
      if (daysUntilRenewal! <= 3) {
        return (label: 'Yakında yenileniyor', color: AppColors.warning);
      }
    }
    return switch (status) {
      SubscriptionStatus.trial => (label: 'Deneme', color: AppColors.trial),
      SubscriptionStatus.active => (label: 'Aktif', color: AppColors.primary),
      SubscriptionStatus.paused => (
          label: 'Duraklatıldı',
          color: AppColors.muted
        ),
      SubscriptionStatus.cancelled => (
          label: 'İptal edildi',
          color: AppColors.success
        ),
      SubscriptionStatus.archived => (
          label: 'Arşivlendi',
          color: AppColors.muted
        ),
      SubscriptionStatus.expired => (
          label: 'Süresi doldu',
          color: AppColors.error
        ),
    };
  }
}
