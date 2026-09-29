import 'payment_event.dart';

/// Ödeme olaylarından türetilen aylık toplam ve değişim hesapları.
///
/// Tüm toplamlar `Money.minorUnits` (int) üzerinden yapılır; floating point
/// yalnızca yüzde oranının son yuvarlamasında kullanılır.
abstract final class PaymentAnalytics {
  /// [months] adet takvim ayı için, en eskiden [now]'un ayına doğru sıralı,
  /// seçili [currency]'deki toplam ödemeyi (minor unit) döner.
  static List<int> monthlyTotals(
    Iterable<PaymentEvent> events,
    String currency, {
    int months = 6,
    DateTime? now,
  }) {
    final reference = now ?? DateTime.now();
    return List.generate(months, (i) {
      final month =
          DateTime(reference.year, reference.month - (months - 1 - i));
      return totalForMonth(events, currency, month);
    });
  }

  /// [month] ayında (yerel saat) [currency] cinsinden ödenen toplam.
  static int totalForMonth(
    Iterable<PaymentEvent> events,
    String currency,
    DateTime month,
  ) {
    var total = 0;
    for (final event in events) {
      final paidAt = event.paidAt.toLocal();
      if (event.currency == currency &&
          paidAt.year == month.year &&
          paidAt.month == month.month) {
        total += event.amount.minorUnits;
      }
    }
    return total;
  }

  /// Bu ay ile geçen ay arasındaki yüzde değişim. Karşılaştırılacak veri yoksa
  /// (olay yok ya da geçen ay toplamı 0) `null` döner.
  ///
  /// [currency] verilmezse ilk olayın para birimi kullanılır.
  static int? monthOverMonthPercent(
    Iterable<PaymentEvent> events, {
    String? currency,
    DateTime? now,
  }) {
    if (events.isEmpty) return null;
    final reference = now ?? DateTime.now();
    final code = currency ?? events.first.currency;
    final current = totalForMonth(events, code, reference);
    final previous = totalForMonth(
      events,
      code,
      DateTime(reference.year, reference.month - 1),
    );
    if (previous == 0) return null;
    return ((current - previous) * 100 / previous).round();
  }
}
