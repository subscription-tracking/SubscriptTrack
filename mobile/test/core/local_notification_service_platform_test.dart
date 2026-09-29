import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/services/local_notification_service.dart';
import 'package:subscript_track/core/services/notification_platform.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:timezone/timezone.dart' as tz;

/// Bekleyen bildirimleri bellekte tutan sahte platform.
class _FakePlatform implements NotificationPlatform {
  final scheduled = <ScheduledNotification>[];
  final shown = <({int id, String title, String body, String? payload})>[];
  final cancelled = <int>[];
  int cancelAllCalls = 0;
  int initializeCalls = 0;
  bool enabled = true;
  bool permissionResult = true;
  bool exactAllowed = true;
  String? launch;
  void Function(String? payload, String? actionId)? onResponse;

  @override
  Future<void> initialize({
    required void Function(String? payload, String? actionId) onResponse,
  }) async {
    initializeCalls++;
    this.onResponse = onResponse;
  }

  @override
  Future<void> schedule(ScheduledNotification notification) async =>
      scheduled.add(notification);

  @override
  Future<void> show({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async =>
      shown.add((id: id, title: title, body: body, payload: payload));

  @override
  Future<void> cancelAll() async {
    cancelAllCalls++;
    scheduled.clear();
  }

  @override
  Future<void> cancel(int id) async {
    cancelled.add(id);
    scheduled.removeWhere((n) => n.id == id);
  }

  @override
  Future<List<PendingNotification>> pending() async =>
      scheduled.map((n) => PendingNotification(n.id, n.payload)).toList();

  @override
  Future<bool> areNotificationsEnabled() async => enabled;

  @override
  Future<bool> requestPermission() async => permissionResult;

  @override
  Future<bool> canScheduleExact() async => exactAllowed;

  @override
  Future<String?> launchPayload() async => launch;
}

Subscription _sub(
  String id, {
  int daysUntilRenewal = 20,
  List<NotificationRule> rules = const [NotificationRule(daysBefore: 3)],
  String name = 'Netflix',
}) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return Subscription(
    id: id,
    userId: 'u',
    name: name,
    amount: Money.parse('99.90'),
    currency: 'TRY',
    billingCycle: BillingCycle.monthly,
    startDate: today.subtract(const Duration(days: 30)),
    nextRenewalDate: today.add(Duration(days: daysUntilRenewal)),
    category: SubscriptionCategory.streaming,
    notificationRules: rules,
    createdAt: today,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(const MethodChannel('flutter_timezone'),
            (call) async => 'Europe/Istanbul');
    addTearDown(() => TestDefaultBinaryMessengerBinding
        .instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            const MethodChannel('flutter_timezone'), null));
  });

  Future<(LocalNotificationService, _FakePlatform)> ready() async {
    final platform = _FakePlatform();
    final service = LocalNotificationService(platform: platform);
    await service.initialize();
    return (service, platform);
  }

  group('başlatma', () {
    test('initialize yalnızca bir kez platforma iner', () async {
      final (service, platform) = await ready();
      await service.initialize();
      expect(platform.initializeCalls, 1);
    });

    test('başlatılmadan hiçbir işlem platforma gitmez', () async {
      final platform = _FakePlatform();
      final service = LocalNotificationService(platform: platform);

      await service.scheduleRenewalReminders([_sub('1')], 3);
      await service.snooze(_sub('1'));
      await service.cancelAll();
      await service.cancelForSubscription('1');
      await service.sendTestNotification();

      expect(platform.scheduled, isEmpty);
      expect(platform.shown, isEmpty);
      expect(platform.cancelAllCalls, 0);
      expect(await service.pendingNotificationIds(), isEmpty);
      expect(await service.arePermissionsGranted(), isTrue);
      expect(await service.getLaunchNotificationSubscriptionId(), isNull);
    });
  });

  group('izinler ve açılış', () {
    test('izin durumu ve isteği platformdan gelir', () async {
      final (service, platform) = await ready();
      platform.enabled = false;
      expect(await service.arePermissionsGranted(), isFalse);
      platform.permissionResult = false;
      expect(await service.requestPermission(), isFalse);
      platform.permissionResult = true;
      expect(await service.requestPermission(), isTrue);
    });

    test('bildirimle açılışta payload döner', () async {
      final (service, platform) = await ready();
      expect(await service.getLaunchNotificationSubscriptionId(), isNull);
      platform.launch = 'sub-7';
      expect(await service.getLaunchNotificationSubscriptionId(), 'sub-7');
    });
  });

  group('bildirim tepkileri', () {
    test('dokunma ve Ertele aksiyonu doğru geri çağrıya gider', () async {
      final (service, platform) = await ready();
      final taps = <String>[];
      final snoozes = <String>[];
      service.onNotificationTap = taps.add;
      service.onSnoozeRequested = snoozes.add;

      platform.onResponse!('sub-1', null);
      platform.onResponse!('sub-2', FlutterNotificationPlatform.snoozeActionId);
      platform.onResponse!(null, null);
      platform.onResponse!('', null);

      expect(taps, ['sub-1']);
      expect(snoozes, ['sub-2']);
    });

    test('geri çağrı yokken tepki hata vermez', () async {
      final (service, platform) = await ready();
      platform.onResponse!('sub-1', null);
      service.dispatchNotificationResponseForTesting(payload: 'x');
    });
  });

  group('scheduleRenewalReminders', () {
    test('planlayıcının sonucunu payload ve tam zaman bilgisiyle zamanlar',
        () async {
      final (service, platform) = await ready();
      await service.scheduleRenewalReminders(
        [_sub('a', daysUntilRenewal: 20), _sub('b', daysUntilRenewal: 10)],
        3,
        timezone: 'Europe/Istanbul',
        reminderHour: 8,
      );

      expect(platform.cancelAllCalls, 1);
      expect(platform.scheduled, hasLength(2));
      expect(platform.scheduled.map((n) => n.payload).toSet(), {'a', 'b'});
      expect(platform.scheduled.every((n) => n.exact), isTrue);
      expect(platform.scheduled.every((n) => n.when.hour == 8), isTrue);
      expect(platform.scheduled.first.when.location.name, 'Europe/Istanbul');
      expect(
          platform.scheduled.first.body, contains('3 gün içinde yenileniyor'));
    });

    test('aynı girdiyle tekrar çağrı yeniden planlama yapmaz', () async {
      final (service, platform) = await ready();
      final subs = [_sub('a')];
      await service.scheduleRenewalReminders(subs, 3,
          timezone: 'Europe/Istanbul');
      await service.scheduleRenewalReminders(subs, 3,
          timezone: 'Europe/Istanbul');
      expect(platform.cancelAllCalls, 1);

      await service.scheduleRenewalReminders([_sub('a', name: 'Başka ad')], 3,
          timezone: 'Europe/Istanbul');
      expect(platform.cancelAllCalls, 2);
    });

    test('tam zamanlı alarm izni yoksa yaklaşık zaman kullanılır', () async {
      final (service, platform) = await ready();
      platform.exactAllowed = false;
      await service.scheduleRenewalReminders([_sub('a')], 3,
          timezone: 'Europe/Istanbul');
      expect(platform.scheduled.single.exact, isFalse);
    });

    test('geçersiz saat 9\'a düşer', () async {
      final (service, platform) = await ready();
      await service.scheduleRenewalReminders([_sub('a')], 3,
          timezone: 'Europe/Istanbul', reminderHour: 99);
      expect(platform.scheduled.single.when.hour, 9);
    });

    test('sınırı aşan sayıda bildirim en yakınlarla sınırlanır', () async {
      final (service, platform) = await ready();
      final subs = [
        for (var i = 0; i < 80; i++) _sub('s$i', daysUntilRenewal: 10 + i),
      ];
      await service.scheduleRenewalReminders(subs, 3,
          timezone: 'Europe/Istanbul');

      expect(platform.scheduled,
          hasLength(LocalNotificationService.maxScheduledNotifications));
      final times = platform.scheduled.map((n) => n.when).toList();
      expect([...times]..sort((a, b) => a.compareTo(b)), times);
    });

    test('deneme bitişleri de zamanlanır', () async {
      final (service, platform) = await ready();
      final today = DateTime.now();
      final trial = _sub('t').copyWith(
        status: SubscriptionStatus.trial,
        trialEndDate: DateTime(today.year, today.month, today.day + 10),
      );
      await service.scheduleRenewalReminders(const [], 3,
          trials: [trial], timezone: 'Europe/Istanbul');
      expect(platform.scheduled.map((n) => n.title),
          everyElement(contains('denemesi sona eriyor')));
      expect(platform.scheduled, hasLength(3));
    });
  });

  group('snooze', () {
    test('tek seferlik, Ertele aksiyonsuz bir bildirim ekler', () async {
      final (service, platform) = await ready();
      final before = DateTime.now();
      await service.snooze(_sub('a'), duration: const Duration(minutes: 10));

      final n = platform.scheduled.single;
      expect(n.payload, 'a');
      expect(n.withSnoozeAction, isFalse);
      expect(n.body, startsWith('Ertelenen hatırlatma'));
      expect(n.when.difference(before).inMinutes, inInclusiveRange(9, 10));
    });

    test('bekleyen bildirim sınırındaysa eklenmez', () async {
      final (service, platform) = await ready();
      for (var i = 0;
          i < LocalNotificationService.maxScheduledNotifications;
          i++) {
        await platform.schedule(ScheduledNotification(
          id: i,
          title: 't',
          body: 'b',
          when: tz.TZDateTime.now(tz.UTC).add(const Duration(days: 1)),
          channelDescription: 'c',
          payload: 'x$i',
          exact: true,
        ));
      }
      await service.snooze(_sub('a'));
      expect(platform.scheduled,
          hasLength(LocalNotificationService.maxScheduledNotifications));
    });
  });

  group('iptal ve tanılama', () {
    test('cancelForSubscription yalnızca o aboneliğin bildirimlerini siler',
        () async {
      final (service, platform) = await ready();
      await service.scheduleRenewalReminders(
        [
          _sub('a', rules: const [
            NotificationRule(daysBefore: 1),
            NotificationRule(daysBefore: 3)
          ]),
          _sub('b')
        ],
        3,
        timezone: 'Europe/Istanbul',
      );
      final beforeCount = platform.scheduled.length;
      await service.snooze(_sub('a'));

      await service.cancelForSubscription('a');

      expect(platform.scheduled.map((n) => n.payload), everyElement('b'));
      expect(platform.cancelled.length, greaterThanOrEqualTo(beforeCount - 1));
      await service.cancelForSubscription('');
    });

    test('cancelAll ve bekleyen kimlikler', () async {
      final (service, platform) = await ready();
      await service.scheduleRenewalReminders([_sub('a')], 3,
          timezone: 'Europe/Istanbul');
      expect(await service.pendingNotificationIds(), hasLength(1));
      await service.cancelAll();
      expect(await service.pendingNotificationIds(), isEmpty);
      expect(platform.scheduled, isEmpty);
    });

    test('test bildirimi ve anlık bildirim platforma gösterilir', () async {
      final (service, platform) = await ready();
      await service.sendTestNotification();
      await service.showPushNotification(
          title: 'Başlık', body: 'Gövde', payload: 'p1');

      expect(platform.shown, hasLength(2));
      expect(platform.shown.first.title, 'Test Bildirimi');
      expect(platform.shown.last.payload, 'p1');
      expect(platform.shown.first.id, isNot(platform.shown.last.id));
    });
  });

  test('saat dilimi yenileme: değişince true, aynıysa false', () async {
    final (service, _) = await ready();
    expect(await service.refreshDeviceLocalTimezone(), isFalse);

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(const MethodChannel('flutter_timezone'),
            (call) async => 'Europe/London');
    expect(await service.refreshDeviceLocalTimezone(), isTrue);
    expect(await service.refreshDeviceLocalTimezone(), isFalse);
  });

  test('bilinmeyen saat dilimi hata vermeden false döner', () async {
    final service = LocalNotificationService(platform: _FakePlatform());
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(const MethodChannel('flutter_timezone'),
            (call) async => 'Mars/Olympus');
    expect(await service.refreshDeviceLocalTimezone(), isFalse);
  });
}
