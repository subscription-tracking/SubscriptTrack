import '../../../core/domain/money.dart';
import '../../subscriptions/domain/subscription_models.dart';
import '../../subscriptions/presentation/subscription_controller.dart';

class CalendarController {
  CalendarController({required this.subscriptions});

  final SubscriptionController subscriptions;

  List<Subscription> renewalsForDay(DateTime day) {
    final target = DateTime(day.year, day.month, day.day);
    return subscriptions.active.where((s) {
      final d = s.nextRenewalDate.toLocal();
      return DateTime(d.year, d.month, d.day) == target;
    }).toList();
  }

  List<Subscription> trialsForDay(DateTime day) {
    final target = DateTime(day.year, day.month, day.day);
    return subscriptions.trials.where((s) {
      final d = s.trialEndDate?.toLocal();
      return d != null && DateTime(d.year, d.month, d.day) == target;
    }).toList();
  }

  Set<DateTime> renewalDaysInMonth(int year, int month) {
    return subscriptions.active.where((s) {
      final d = s.nextRenewalDate.toLocal();
      return d.year == year && d.month == month;
    }).map((s) {
      final d = s.nextRenewalDate.toLocal();
      return DateTime(d.year, d.month, d.day);
    }).toSet();
  }

  Set<DateTime> trialDaysInMonth(int year, int month) => subscriptions.trials
      .map((s) => s.trialEndDate?.toLocal())
      .whereType<DateTime>()
      .where((d) => d.year == year && d.month == month)
      .map((d) => DateTime(d.year, d.month, d.day))
      .toSet();

  /// Para birimine göre aylık toplam — farklı para birimleri karışmaz.
  Map<String, Money> totalsByCurrencyForMonth(int year, int month) {
    final map = <String, Money>{};
    for (final s in subscriptions.active) {
      final d = s.nextRenewalDate.toLocal();
      if (d.year == year && d.month == month) {
        final curr = map[s.currency];
        map[s.currency] = curr == null ? s.amount : curr + s.amount;
      }
    }
    return map;
  }
}
