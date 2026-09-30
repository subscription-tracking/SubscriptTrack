import '../../../core/domain/money.dart';
import '../../../core/utils/date_time_utils.dart';
import 'subscription_models.dart';

/// Abonelik listesinden türetilen durum bazlı listeler ve toplamlar.
///
/// Sonuçlar ilk erişimde hesaplanıp önbelleğe alınır; kaynak liste değiştiğinde
/// yeni bir örnek oluşturulmalıdır (controller bunu her bildirimde yapar).
class SubscriptionSelectors {
  SubscriptionSelectors(this._items);

  final List<Subscription> _items;

  /// Bu örneğin oluşturulduğu günün numarası; tarih karşılaştırmaları her
  /// abonelik için `DateTime.now()` çağırmadan bunu kullanır.
  final int _today = DateTimeUtils.dayNumber(DateTime.now());

  List<Subscription>? _active;
  List<Subscription>? _notStarted;
  List<Subscription>? _trials;
  List<Subscription>? _paused;
  List<Subscription>? _cancelled;
  List<Subscription>? _expired;
  List<Subscription>? _archived;
  Map<String, Money>? _totalsByCurrency;

  List<Subscription> _byStatus(SubscriptionStatus status) =>
      _items.where((s) => s.status == status).toList();

  List<Subscription> get active => _active ??= (_items
      .where((s) =>
          s.status == SubscriptionStatus.active && !s.isNotStartedOnDay(_today))
      .toList()
    ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate)));

  List<Subscription> get notStarted =>
      _notStarted ??= (_items.where((s) => s.isNotStartedOnDay(_today)).toList()
        ..sort((a, b) => a.startDate.compareTo(b.startDate)));

  List<Subscription> get trials =>
      _trials ??= (_byStatus(SubscriptionStatus.trial)
        ..sort((a, b) => (a.trialEndDate ?? a.nextRenewalDate)
            .compareTo(b.trialEndDate ?? b.nextRenewalDate)));

  List<Subscription> get paused =>
      _paused ??= _byStatus(SubscriptionStatus.paused);

  List<Subscription> get cancelled =>
      _cancelled ??= _byStatus(SubscriptionStatus.cancelled);

  List<Subscription> get expired =>
      _expired ??= _byStatus(SubscriptionStatus.expired);

  List<Subscription> get archived =>
      _archived ??= _byStatus(SubscriptionStatus.archived);

  /// Önümüzdeki 30 gün içinde yenilenecek aktif abonelikler.
  List<Subscription> get upcomingRenewals => active.where((s) {
        final days = s.daysUntilRenewalFrom(_today);
        return days >= 0 && days <= 30;
      }).toList();

  /// Aktif aboneliklerin önümüzdeki [months] aydaki yenilemeleri, tarihe göre.
  List<(Subscription subscription, DateTime date)> projectedRenewals({
    int months = 12,
  }) {
    final result = <(Subscription, DateTime)>[];
    for (final subscription in active) {
      for (final date in subscription.projectedRenewals(count: months)) {
        result.add((subscription, date));
      }
    }
    result.sort((a, b) => a.$2.compareTo(b.$2));
    return result;
  }

  /// Aktif aboneliklerin para birimi başına aylık toplamı. Farklı para
  /// birimlerinin minor unit'leri asla birbirine eklenmez.
  Map<String, Money> get totalsByCurrency {
    final cached = _totalsByCurrency;
    if (cached != null) return cached;
    final map = <String, Money>{};
    for (final s in active) {
      final current = map[s.currency];
      map[s.currency] =
          current == null ? s.monthlyAmount : current + s.monthlyAmount;
    }
    return _totalsByCurrency = map;
  }

  /// Yalnızca listedeki ilk aktif aboneliğin para birimi toplanır; çoklu para
  /// birimi için [totalsByCurrency] kullanılmalıdır.
  Money get totalMonthly {
    if (active.isEmpty) return Money.zero;
    final primaryCurrency = active.first.currency;
    return active
        .where((s) => s.currency == primaryCurrency)
        .fold(Money.zero, (sum, s) => sum + s.monthlyAmount);
  }
}
