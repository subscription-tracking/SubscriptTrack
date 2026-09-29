import '../../../core/domain/money.dart';
import '../../subscriptions/domain/subscription_models.dart';
import 'payment_analytics.dart';
import 'payment_event.dart';

/// İstatistikler ekranının seçili para birimi için türetilmiş verisi.
/// Saf Dart: widget/controller bağımlılığı yok, doğrudan birim test edilir.
class StatsViewModel {
  const StatsViewModel._({
    required this.availableCurrencies,
    required this.currency,
    required this.monthly,
    required this.yearly,
    required this.activeCount,
    required this.trend,
    required this.hasPaymentHistory,
    required this.categories,
    required this.dueSoon,
    required this.highestSubscription,
  });

  final List<String> availableCurrencies;
  final String currency;
  final Money monthly;
  final Money yearly;
  final int activeCount;

  /// Son N ayın ödeme toplamları (minor unit), eskiden yeniye.
  final List<int> trend;
  final bool hasPaymentHistory;

  /// Aylık tutara göre azalan sıralı kategori dağılımı.
  final List<MapEntry<SubscriptionCategory, Money>> categories;

  /// Önümüzdeki 7 gün içinde yenilenen en fazla 3 abonelik.
  final List<Subscription> dueSoon;
  final Subscription? highestSubscription;

  /// [totals] boşsa `null` döner (gösterilecek para birimi yok).
  static StatsViewModel? build({
    required Map<String, Money> totals,
    required List<Subscription> active,
    required List<PaymentEvent> paymentEvents,
    String? selectedCurrency,
    int months = 6,
    DateTime? now,
  }) {
    if (totals.isEmpty) return null;
    final reference = now ?? DateTime.now();
    final available = totals.keys.toList();
    final currency =
        selectedCurrency != null && available.contains(selectedCurrency)
            ? selectedCurrency
            : available.first;
    final monthly = totals[currency] ?? Money.zero;

    final dueSoon = ([...active]
          ..sort((a, b) => a.nextRenewalDate.compareTo(b.nextRenewalDate)))
        .where((s) {
          final days = s.nextRenewalDate.difference(reference).inDays;
          return days <= 7 && days >= 0;
        })
        .take(3)
        .toList();

    final highest = ([...active.where((s) => s.currency == currency)]
          ..sort((a, b) => b.monthlyAmount.compareTo(a.monthlyAmount)))
        .firstOrNull;

    return StatsViewModel._(
      availableCurrencies: available,
      currency: currency,
      monthly: monthly,
      yearly: monthly * 12,
      activeCount: active.where((s) => s.currency == currency).length,
      trend: PaymentAnalytics.monthlyTotals(
        paymentEvents,
        currency,
        months: months,
        now: reference,
      ),
      hasPaymentHistory: paymentEvents.any((e) => e.currency == currency),
      categories: categoryBreakdown(active, currency),
      dueSoon: dueSoon,
      highestSubscription: highest,
    );
  }

  /// [currency] için kategori başına aylık toplam, büyükten küçüğe.
  static List<MapEntry<SubscriptionCategory, Money>> categoryBreakdown(
    List<Subscription> subscriptions,
    String currency,
  ) {
    final map = <SubscriptionCategory, Money>{};
    for (final s in subscriptions.where((s) => s.currency == currency)) {
      map[s.category] = (map[s.category] ?? Money.zero) + s.monthlyAmount;
    }
    return map.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
  }
}
