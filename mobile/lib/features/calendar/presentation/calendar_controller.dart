import '../../subscriptions/domain/subscription_models.dart';
import '../../subscriptions/presentation/subscription_controller.dart';

class CalendarController {
  CalendarController({required this.subscriptions});

  final SubscriptionController subscriptions;

  List<Subscription> renewalsForDay(DateTime day) {
    final target = DateTime(day.year, day.month, day.day);
    return subscriptions.active.where((s) {
      final d = s.nextRenewalDate;
      return DateTime(d.year, d.month, d.day) == target;
    }).toList();
  }

  Set<DateTime> renewalDaysInMonth(int year, int month) {
    return subscriptions.active
        .where((s) =>
            s.nextRenewalDate.year == year &&
            s.nextRenewalDate.month == month)
        .map((s) {
          final d = s.nextRenewalDate;
          return DateTime(d.year, d.month, d.day);
        })
        .toSet();
  }

  /// Para birimine göre aylık toplam — farklı para birimleri karışmaz.
  Map<String, double> totalsByCurrencyForMonth(int year, int month) {
    final map = <String, double>{};
    for (final s in subscriptions.active) {
      if (s.nextRenewalDate.year == year && s.nextRenewalDate.month == month) {
        map[s.currency] = (map[s.currency] ?? 0) + s.amount;
      }
    }
    return map;
  }
}
