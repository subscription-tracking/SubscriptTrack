import 'package:timezone/timezone.dart' as tz;

import '../../features/notifications/domain/notification_rule.dart';
import '../../features/subscriptions/domain/subscription_models.dart';

/// Plugin çağrısından önce hesaplanan, saf bir bildirim adayı.
class PlannedReminder {
  const PlannedReminder({
    required this.id,
    required this.title,
    required this.body,
    required this.scheduled,
    required this.channelDescription,
    required this.payload,
  });

  final int id;
  final String title;
  final String body;
  final tz.TZDateTime scheduled;
  final String channelDescription;

  /// Bildirime dokunulunca açılacak aboneliğin id'si.
  final String payload;
}

/// Hangi bildirimin ne zaman gösterileceğini hesaplayan saf planlayıcı.
/// Platform/plugin bağımlılığı yoktur; birim testle doğrulanır.
abstract final class ReminderPlanner {
  /// iOS aynı anda en fazla 64 bekleyen yerel bildirime izin verir; üzerinde
  /// OS eski/rastgele bildirimleri sessizce düşürür. Platformdan bağımsız
  /// güvenli bir üst sınır uygularız (Test 57).
  static const defaultLimit = 60;

  static const _trialReminderDays = [7, 3, 1];
  static const _maxNotificationId = 2147483647;

  /// Yenileme ve deneme hatırlatmalarını hesaplar; geçmişte kalanları eler,
  /// en yakın [limit] tanesini zamana göre sıralı döner.
  static List<PlannedReminder> plan({
    required List<Subscription> subscriptions,
    required int daysBefore,
    required tz.Location location,
    required tz.TZDateTime now,
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int hour = 9,
    int limit = defaultLimit,
  }) {
    final candidates = <PlannedReminder>[
      ..._renewalReminders(
          subscriptions, daysBefore, rules, hour, location, now),
      ..._trialReminders(trials, hour, location, now),
    ]..sort((a, b) => a.scheduled.compareTo(b.scheduled));

    // Test 57: en yakın (en öncelikli) hatırlatmalar korunur, kalanı atılır.
    return candidates.length > limit
        ? candidates.sublist(0, limit)
        : candidates;
  }

  /// Planlamanın girdilerinden bir parmak izi üretir; değişmediyse yeniden
  /// planlama atlanır.
  static int fingerprint(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int reminderHour = 9,
  }) =>
      Object.hashAll([
        daysBefore,
        timezone,
        reminderHour,
        ...rules.expand((r) => [r.daysBefore, r.enabled]),
        ...subscriptions.expand(
          (s) => [
            s.id,
            s.name,
            s.amount.minorUnits,
            s.currency,
            s.nextRenewalDate.millisecondsSinceEpoch,
            s.status.index,
            ...s.notificationRules.expand((r) => [r.daysBefore, r.enabled]),
          ],
        ),
        ...trials.expand(
          (s) => [
            s.id,
            s.name,
            s.amount.minorUnits,
            s.currency,
            s.trialEndDate?.millisecondsSinceEpoch,
            s.status.index,
          ],
        ),
      ]);

  static Iterable<PlannedReminder> _renewalReminders(
    List<Subscription> subscriptions,
    int daysBefore,
    List<NotificationRule> rules,
    int hour,
    tz.Location location,
    tz.TZDateTime now,
  ) sync* {
    for (final sub in subscriptions) {
      final configuredRules =
          sub.notificationRules.isNotEmpty ? sub.notificationRules : rules;
      final renewalDays = configuredRules.isEmpty
          ? [daysBefore]
          : (configuredRules
              .where((r) => r.enabled)
              .map((r) => r.daysBefore)
              .toSet()
              .toList()
            ..sort());
      for (final reminderDaysBefore in renewalDays) {
        final reminderDay =
            sub.nextRenewalDate.subtract(Duration(days: reminderDaysBefore));
        final scheduled = tz.TZDateTime(
          location,
          reminderDay.year,
          reminderDay.month,
          reminderDay.day,
          hour,
        );
        if (scheduled.isBefore(now)) continue;

        final amount = '${sub.amount.amount} ${sub.currency}';
        yield PlannedReminder(
          // Bileşik anahtar: abonelik + gün sayısı + tarih → çakışmayı önler.
          id: _stableId(
              '${sub.id}|$reminderDaysBefore|${_dateKey(reminderDay)}'),
          title: sub.name,
          body: reminderDaysBefore == 0
              ? 'Bugün yenileniyor — $amount'
              : '$reminderDaysBefore gün içinde yenileniyor — $amount',
          scheduled: scheduled,
          channelDescription: 'Abonelik yenileme bildirimleri',
          payload: sub.id,
        );
      }
    }
  }

  static Iterable<PlannedReminder> _trialReminders(
    List<Subscription> trials,
    int hour,
    tz.Location location,
    tz.TZDateTime now,
  ) sync* {
    for (final sub in trials) {
      final end = sub.trialEndDate?.toLocal();
      if (end == null) continue;
      for (final days in _trialReminderDays) {
        final reminder = end.subtract(Duration(days: days));
        final scheduled = tz.TZDateTime(
          location,
          reminder.year,
          reminder.month,
          reminder.day,
          hour,
        );
        if (scheduled.isBefore(now)) continue;

        yield PlannedReminder(
          id: _stableId('${sub.id}|trial|$days|${_dateKey(end)}'),
          title: '${sub.name} denemesi sona eriyor',
          body: 'Ücretsiz denemenin bitmesine $days gün kaldı.',
          scheduled: scheduled,
          channelDescription: 'Ücretsiz deneme ve yenileme hatırlatmaları',
          payload: sub.id,
        );
      }
    }
  }

  static String _dateKey(DateTime d) =>
      '${d.year}${d.month.toString().padLeft(2, '0')}${d.day.toString().padLeft(2, '0')}';

  static int _stableId(String key) => key.hashCode.abs() % _maxNotificationId;
}
