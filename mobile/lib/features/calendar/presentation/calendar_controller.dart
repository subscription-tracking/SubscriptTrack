import '../../subscriptions/domain/subscription_models.dart';
import '../../subscriptions/presentation/subscription_controller.dart';

class CalendarController {
  CalendarController({required this.subscriptions});

  final SubscriptionController subscriptions;

  // Belirli bir güne düşen yenilemeleri döner
  List<Subscription> renewalsForDay(DateTime day) {
    final target = DateTime(day.year, day.month, day.day);
    return subscriptions.active.where((s) {
      final d = s.nextRenewalDate;
      return DateTime(d.year, d.month, d.day) == target;
    }).toList();
  }

  // Bu ayın tüm yenileme günleri (Set — hızlı lookup için)
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

  // Seçili ayın toplam maliyeti
  double totalForMonth(int year, int month) {
    return subscriptions.active
        .where((s) =>
            s.nextRenewalDate.year == year &&
            s.nextRenewalDate.month == month)
        .fold(0.0, (sum, s) => sum + s.amount);
  }
}
