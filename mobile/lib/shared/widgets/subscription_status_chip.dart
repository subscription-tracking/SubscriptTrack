import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart' show AppStatusColors, AppStatusColorsX;
import '../../features/subscriptions/domain/subscription_models.dart';

class SubscriptionStatusChip extends StatelessWidget {
  const SubscriptionStatusChip({
    required this.status,
    this.isNotStarted = false,
    this.daysUntilRenewal,
    super.key,
  });

  final SubscriptionStatus status;
  final bool isNotStarted;
  final int? daysUntilRenewal;

  @override
  Widget build(BuildContext context) {
    final state = _state(context);
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

  /// Aktif aboneliğin yenilemeye yakınlığına göre uyarı durumu; yoksa `null`.
  ({String label, Color color})? _urgency(
    ColorScheme cs,
    AppStatusColors statusColors,
  ) {
    final days = daysUntilRenewal;
    if (status != SubscriptionStatus.active || days == null) return null;
    if (days < 0) return (label: 'Gecikmiş', color: cs.error);
    if (days == 0) return (label: 'Bugün yenileniyor', color: cs.error);
    if (days <= 3) {
      return (label: 'Yakında yenileniyor', color: statusColors.warning);
    }
    return null;
  }

  ({String label, Color color}) _state(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final statusColors = context.statusColors;
    if (isNotStarted) {
      return (label: 'Henüz başlamadı', color: statusColors.warning);
    }
    final urgency = _urgency(cs, statusColors);
    if (urgency != null) return urgency;
    return switch (status) {
      SubscriptionStatus.trial => (label: 'Deneme', color: statusColors.trial),
      SubscriptionStatus.active => (label: 'Aktif', color: cs.primary),
      SubscriptionStatus.paused => (
          label: 'Duraklatıldı',
          color: statusColors.muted
        ),
      SubscriptionStatus.cancelled => (
          label: 'İptal edildi',
          color: statusColors.success
        ),
      SubscriptionStatus.archived => (
          label: 'Arşivlendi',
          color: statusColors.muted
        ),
      SubscriptionStatus.expired => (label: 'Süresi doldu', color: cs.error),
    };
  }
}
