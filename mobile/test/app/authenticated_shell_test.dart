import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/app/router/app_router.dart';
import 'package:subscript_track/app/shell/app_shell.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';
import 'package:subscript_track/features/subscriptions/data/local_subscription_repository.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../support/fake_auth.dart';

/// Çağrıları kaydeden bildirim uygulaması.
class _Scheduler extends NoopNotificationScheduler {
  String? launch;
  final scheduleCalls = <List<String>>[];
  final snoozed = <String>[];
  int cancelAllCalls = 0;
  bool timezoneChanged = false;
  int timezoneChecks = 0;

  @override
  Future<String?> getLaunchNotificationSubscriptionId() async => launch;

  @override
  Future<void> scheduleRenewalReminders(
    List<Subscription> subscriptions,
    int daysBefore, {
    String timezone = '',
    List<Subscription> trials = const [],
    List<NotificationRule> rules = const [],
    int reminderHour = 9,
  }) async =>
      scheduleCalls.add(subscriptions.map((s) => s.name).toList());

  @override
  Future<void> snooze(Subscription sub, {Duration? duration}) async =>
      snoozed.add(sub.id);

  @override
  Future<void> cancelAll() async => cancelAllCalls++;

  @override
  Future<bool> refreshDeviceLocalTimezone() async {
    timezoneChecks++;
    return timezoneChanged;
  }
}

Future<String> _seedSubscription() async {
  final sub = await LocalSubscriptionRepository().create(
    userId: 'user-1',
    name: 'Netflix',
    amount: Money.parse('99.90'),
    currency: 'TRY',
    billingCycle: BillingCycle.monthly,
    startDate: DateTime.now().subtract(const Duration(days: 30)),
    nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
    category: SubscriptionCategory.streaming,
  );
  return sub.id;
}

/// Gerçek router + AuthenticatedShell ile uygulamayı açar.
Future<
    ({
      _Scheduler scheduler,
      SettingsController settings,
      SubscriptionController Function() subs,
      GoRouter router
    })> _boot(
  WidgetTester tester, {
  String email = 'kisi@example.com',
  String? Function()? launchPayload,
  Future<void> Function()? beforeBoot,
}) async {
  FlutterSecureStorage.setMockInitialValues({});
  final s = await signedInAuth(email: email);
  await beforeBoot?.call();
  await tester.binding.setSurfaceSize(const Size(390, 844));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final scheduler = _Scheduler()..launch = launchPayload?.call();
  final settings = SettingsController();
  final router = AppRouter.create(s.auth);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthController>.value(value: s.auth),
      ChangeNotifierProvider<SettingsController>.value(value: settings),
      InheritedProvider<AppPreferences>.value(value: settings),
      ChangeNotifierProvider<AppLockService>(create: (_) => AppLockService()),
      Provider<NotificationScheduler>.value(value: scheduler),
    ],
    child: MaterialApp.router(routerConfig: router),
  ));
  await tester.pump();
  await tester
      .runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pumpAndSettle();
  return (
    scheduler: scheduler,
    settings: settings,
    subs: () =>
        tester.element(find.byType(AppShell)).read<SubscriptionController>(),
    router: router,
  );
}

Future<void> _settleAsync(WidgetTester tester) async {
  await tester.pump();
  await tester
      .runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('açılışta bildirim geri çağrıları kaydedilir, kapanınca kalkar',
      (tester) async {
    final app = await _boot(tester);
    expect(app.scheduler.onNotificationTap, isNotNull);
    expect(app.scheduler.onSnoozeRequested, isNotNull);

    await tester.pumpWidget(const SizedBox());
    expect(app.scheduler.onNotificationTap, isNull);
    expect(app.scheduler.onSnoozeRequested, isNull);
  });

  testWidgets('abonelikler yüklenince bildirimler planlanır', (tester) async {
    late String id;
    final app = await _boot(tester, beforeBoot: () async {
      id = await _seedSubscription();
    });
    expect(id, isNotEmpty);
    expect(app.scheduler.scheduleCalls, isNotEmpty);
    expect(app.scheduler.scheduleCalls.last, ['Netflix']);
  });

  testWidgets('bildirimler kapalıysa planlama yerine iptal edilir',
      (tester) async {
    final app = await _boot(tester, beforeBoot: () async {
      await _seedSubscription();
    });
    await app.settings.setNotifications(false);
    await app.subs().load();
    await _settleAsync(tester);
    expect(app.scheduler.cancelAllCalls, greaterThan(0));
  });

  testWidgets('hatırlatma ayarı değişince yeniden planlanır', (tester) async {
    final app = await _boot(tester, beforeBoot: () async {
      await _seedSubscription();
    });
    final before = app.scheduler.scheduleCalls.length;
    await app.settings.setDaysBefore(7);
    await tester.pump();
    expect(app.scheduler.scheduleCalls.length, before + 1);
  });

  testWidgets('bildirime dokunma: bilinen abonelik detayını açar',
      (tester) async {
    late String id;
    final app = await _boot(tester, beforeBoot: () async {
      id = await _seedSubscription();
    });

    app.scheduler.onNotificationTap!(id);
    await tester.pumpAndSettle();
    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
  });

  testWidgets('bildirime dokunma: henüz yüklenmemiş abonelik beklemeye alınır',
      (tester) async {
    final app = await _boot(tester);
    app.scheduler.onNotificationTap!('henuz-yok');
    await tester.pumpAndSettle();
    expect(find.byType(SubscriptionDetailScreen), findsNothing);

    // Abonelik sonradan gelince yönlendirme yapılır.
    final id = await tester.runAsync(_seedSubscription);
    app.scheduler.onNotificationTap!(id!);
    await app.subs().load();
    await _settleAsync(tester);
    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
  });

  testWidgets('soğuk başlangıçta bildirimle açılış detaya yönlendirir',
      (tester) async {
    String? id;
    await _boot(
      tester,
      beforeBoot: () async => id = await _seedSubscription(),
      launchPayload: () => id,
    );
    await _settleAsync(tester);
    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
  });

  testWidgets('Ertele isteği bilinen aboneliği zamanlayıcıya iletir',
      (tester) async {
    late String id;
    final app = await _boot(tester, beforeBoot: () async {
      id = await _seedSubscription();
    });

    app.scheduler.onSnoozeRequested!(id);
    app.scheduler.onSnoozeRequested!('bilinmeyen');
    await tester.pump();
    expect(app.scheduler.snoozed, [id]);
  });

  testWidgets(
      'uygulama öne dönünce saat dilimi kontrol edilir ve yeniden planlanır',
      (tester) async {
    final app = await _boot(tester, beforeBoot: () async {
      await _seedSubscription();
    });
    final before = app.scheduler.scheduleCalls.length;
    app.scheduler.timezoneChanged = true;

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await _settleAsync(tester);

    expect(app.scheduler.timezoneChecks, greaterThan(0));
    expect(app.scheduler.scheduleCalls.length, greaterThan(before));
  });

  testWidgets('test hesabında boş liste örnek verilerle doldurulur',
      (tester) async {
    final app = await _boot(tester, email: 'testkullanici@subscripttrack.app');
    await _settleAsync(tester);
    final names = app.subs().allItems.map((s) => s.name).toList();
    expect(names, containsAll(['Netflix', 'Spotify', 'iCloud+']));
  });

  testWidgets('normal hesapta örnek veri eklenmez', (tester) async {
    final app = await _boot(tester);
    await _settleAsync(tester);
    expect(app.subs().allItems, isEmpty);
  });
}
