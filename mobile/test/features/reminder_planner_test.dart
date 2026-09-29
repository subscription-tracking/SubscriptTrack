import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/reminder_planner.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

Subscription _sub(
  String id,
  DateTime renewal, {
  List<NotificationRule> rules = const [],
  DateTime? trialEnd,
}) =>
    Subscription(
      id: id,
      userId: 'u',
      name: id,
      amount: Money.parse('10'),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime(2026, 1, 1),
      nextRenewalDate: renewal,
      category: SubscriptionCategory.other,
      notificationRules: rules,
      trialEndDate: trialEnd,
      createdAt: DateTime(2026, 1, 1),
    );

void main() {
  late tz.Location istanbul;
  late tz.TZDateTime now;

  setUpAll(() {
    tzdata.initializeTimeZones();
    istanbul = tz.getLocation('Europe/Istanbul');
    now = tz.TZDateTime(istanbul, 2026, 9, 1, 8);
  });

  List<PlannedReminder> plan(
    List<Subscription> subs, {
    List<Subscription> trials = const [],
    int limit = ReminderPlanner.defaultLimit,
    List<NotificationRule> rules = const [],
  }) =>
      ReminderPlanner.plan(
        subscriptions: subs,
        trials: trials,
        daysBefore: 3,
        rules: rules,
        location: istanbul,
        now: now,
        limit: limit,
      );

  test('varsayılan olarak yenilemeden 3 gün önce, seçili saatte planlar', () {
    final result = plan([_sub('a', DateTime(2026, 9, 20))]);
    expect(result, hasLength(1));
    expect(result.single.scheduled, tz.TZDateTime(istanbul, 2026, 9, 17, 9));
    expect(result.single.payload, 'a');
    expect(result.single.body, contains('3 gün içinde yenileniyor'));
  });

  test('geçmişte kalan hatırlatmalar elenir', () {
    expect(plan([_sub('a', DateTime(2026, 9, 2))]), isEmpty);
  });

  test('0 gün kuralı "Bugün yenileniyor" der', () {
    final result = plan([
      _sub('a', DateTime(2026, 9, 20),
          rules: const [NotificationRule(daysBefore: 0)])
    ]);
    expect(result.single.body, startsWith('Bugün yenileniyor'));
  });

  test('devre dışı kurallar planlanmaz', () {
    final result = plan([
      _sub('a', DateTime(2026, 9, 20), rules: const [
        NotificationRule(daysBefore: 1, enabled: false),
        NotificationRule(daysBefore: 2),
      ])
    ]);
    expect(result, hasLength(1));
    expect(result.single.scheduled.day, 18);
  });

  test('deneme bitişi için 7/3/1 gün önce hatırlatır', () {
    final trial =
        _sub('t', DateTime(2026, 9, 30), trialEnd: DateTime(2026, 9, 30));
    final result = plan(const [], trials: [trial]);
    expect(result.map((r) => r.scheduled.day), [23, 27, 29]);
    expect(result.first.title, 't denemesi sona eriyor');
  });

  test('en yakın hatırlatmalar sıralı korunur ve limit uygulanır', () {
    final subs = [
      for (var i = 0; i < 5; i++) _sub('s$i', DateTime(2026, 9, 10 + i * 3)),
    ];
    final result = plan(subs, limit: 3);
    expect(result, hasLength(3));
    final times = result.map((r) => r.scheduled).toList();
    expect([...times]..sort((a, b) => a.compareTo(b)), times);
    expect(result.first.payload, 's0');
  });

  test('aynı girdi kararlı bildirim id üretir', () {
    final a = plan([_sub('a', DateTime(2026, 9, 20))]).single.id;
    final b = plan([_sub('a', DateTime(2026, 9, 20))]).single.id;
    expect(a, b);
  });
}
