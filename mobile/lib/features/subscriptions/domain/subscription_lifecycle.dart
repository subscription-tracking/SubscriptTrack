import '../../../core/utils/date_time_utils.dart';
import 'subscription_models.dart';

/// Abonelik yaşam döngüsü kuralları (saf fonksiyonlar, I/O yok).
abstract final class SubscriptionLifecycle {
  static DateTime _dateOnly(DateTime d) => DateTime(d.year, d.month, d.day);

  /// Deneme bitiş günü [now]'dan önce kalmış deneme abonelikleri.
  static List<Subscription> endedTrials(
    Iterable<Subscription> items, {
    DateTime? now,
  }) {
    final today = DateTimeUtils.dayNumber(now ?? DateTime.now());
    return items.where((s) {
      final end = s.trialEndDate;
      return s.status == SubscriptionStatus.trial &&
          end != null &&
          DateTimeUtils.dayNumber(end) < today;
    }).toList();
  }

  /// Yenileme tarihi geçmişte kalmış, başlamış aktif abonelikler.
  static List<Subscription> overdueRenewals(
    Iterable<Subscription> items, {
    DateTime? now,
  }) {
    final today = _dateOnly(now ?? DateTime.now());
    return items
        .where((s) =>
            s.status == SubscriptionStatus.active &&
            !s.isNotStarted &&
            s.nextRenewalDate.isBefore(today))
        .toList();
  }

  /// Kaçırılan dönemleri tek adımda bugüne/sonrasına taşır.
  static Subscription advanceOverdue(Subscription s, {DateTime? now}) =>
      s.copyWith(
          nextRenewalDate: _nextOnOrAfter(s, _dateOnly(now ?? DateTime.now())));

  /// Kullanıcı "yenilendi" dediğinde bir sonraki yenileme (yarın veya sonrası).
  static Subscription markRenewed(Subscription s, {DateTime? now}) {
    final n = now ?? DateTime.now();
    return s.copyWith(
      nextRenewalDate: _nextOnOrAfter(s, DateTime(n.year, n.month, n.day + 1)),
    );
  }

  static DateTime _nextOnOrAfter(Subscription s, DateTime threshold) =>
      DateTimeUtils.nextOccurrenceOnOrAfter(
        s.nextRenewalDate,
        s.billingCycle.key,
        threshold,
        originalAnchor: s.startDate,
      );
}
