import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/navigation/app_routes.dart';
import 'package:subscript_track/features/notifications/domain/app_notification.dart';
import 'package:subscript_track/features/notifications/presentation/notification_controller.dart';
import 'package:subscript_track/features/notifications/presentation/screens/notification_center_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../../support/fake_subscription_repo.dart';
import '../../support/routed_app.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('NotificationController.refresh (çevrimdışı üretim)', () {
    test('yenileme günlerine göre doğru tür ve metin üretir', () {
      final c = NotificationController();
      c.refresh([
        testSubscription('1', name: 'Bugün', daysUntilRenewal: 0),
        testSubscription('2', name: 'Yarın', daysUntilRenewal: 2),
        testSubscription('3', name: 'Haftaya', daysUntilRenewal: 6),
        testSubscription('4', name: 'Uzak', daysUntilRenewal: 20),
      ]);

      expect(c.all.map((n) => n.type), [
        NotificationType.renewalToday,
        NotificationType.renewalSoon,
        NotificationType.renewalUpcoming,
      ]);
      expect(c.all[0].body, 'Bugün bugün yenileniyor.');
      expect(c.all[1].title, '2 gün kaldı');
      expect(c.all[2].title, 'Yaklaşan yenileme');
      expect(c.unreadCount, 3);
    });

    test('geçmiş yenilemeler bildirim üretmez', () {
      final c = NotificationController();
      c.refresh([testSubscription('1', daysUntilRenewal: -2)]);
      expect(c.all, isEmpty);
    });

    test('deneme bitişi için bildirim üretir', () {
      final c = NotificationController();
      final today = DateTime.now();
      Subscription trial(String id, int days) => testSubscription(id).copyWith(
            status: SubscriptionStatus.trial,
            trialEndDate: DateTime(today.year, today.month, today.day + days),
            nextRenewalDate: today.add(const Duration(days: 60)),
          );
      c.refresh(const [], trials: [
        trial('a', 0),
        trial('b', 2),
        trial('c', 6),
        trial('d', 30)
      ]);

      expect(c.all.map((n) => n.type), [
        NotificationType.trialToday,
        NotificationType.trialSoon,
        NotificationType.trialUpcoming,
      ]);
      expect(c.all.first.title, 'Ücretsiz deneme bugün sona eriyor');
    });

    test('okundu/gizlendi bilgisi kalıcıdır ve sayaçları etkiler', () async {
      final c = NotificationController();
      c.refresh([
        testSubscription('1', daysUntilRenewal: 1),
        testSubscription('2', daysUntilRenewal: 2),
        testSubscription('3', daysUntilRenewal: 3),
      ]);
      final ids = c.all.map((n) => n.id).toList();

      await c.markRead(ids[0]);
      expect(c.isRead(ids[0]), isTrue);
      expect(c.unreadCount, 2);

      await c.dismiss(ids[1]);
      expect(c.all.map((n) => n.id), isNot(contains(ids[1])));
      expect(c.unreadCount, 1);

      await c.markAllRead();
      expect(c.unreadCount, 0);

      final reloaded = NotificationController();
      await reloaded.loadReadState();
      reloaded.refresh([
        testSubscription('1', daysUntilRenewal: 1),
        testSubscription('2', daysUntilRenewal: 2),
        testSubscription('3', daysUntilRenewal: 3),
      ]);
      expect(reloaded.all, hasLength(2), reason: 'gizlenen bildirim dönmez');
      expect(reloaded.unreadCount, 0);
    });

    test('artık üretilmeyen bildirimlerin okundu kayıtları temizlenir',
        () async {
      final c = NotificationController();
      c.refresh([testSubscription('1', daysUntilRenewal: 1)]);
      await c.markAllRead();
      c.refresh(const []);
      c.refresh([testSubscription('1', daysUntilRenewal: 1)]);
      expect(c.unreadCount, 1, reason: 'eski okundu kaydı temizlenmişti');
    });
  });

  group('NotificationCenterScreen', () {
    Future<({NotificationController notif, SubscriptionController subs})> pump(
      WidgetTester tester,
      List<Subscription> subs,
    ) async {
      await tester.binding.setSurfaceSize(const Size(420, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final subscriptions = SubscriptionController(
        userId: 'u1',
        repository: FakeSubscriptionRepo(subs),
      );
      await subscriptions.load();
      final notif = NotificationController()..refresh(subscriptions.active);
      await tester.pumpWidget(routedApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => context.push(AppRoutes.notifications),
              child: const Text('aç'),
            ),
          ),
        ),
        providers: [
          ChangeNotifierProvider<SubscriptionController>.value(
              value: subscriptions),
          ChangeNotifierProvider<NotificationController>.value(value: notif),
        ],
      ));
      await tester.tap(find.text('aç'));
      await tester.pumpAndSettle();
      return (notif: notif, subs: subscriptions);
    }

    testWidgets('bildirim yokken boş durum', (tester) async {
      await pump(tester, [testSubscription('1', daysUntilRenewal: 30)]);
      expect(find.byType(NotificationCenterScreen), findsOneWidget);
      expect(find.text('Yeni bildirim yok'), findsOneWidget);
      expect(find.text('Tümünü okundu say'), findsNothing);
    });

    testWidgets('bildirimler listelenir ve "Tümünü okundu say" çalışır',
        (tester) async {
      final s = await pump(tester, [
        testSubscription('1', name: 'Netflix', daysUntilRenewal: 0),
        testSubscription('2', name: 'Spotify', daysUntilRenewal: 2),
      ]);
      expect(find.text('Netflix bugün yenileniyor.'), findsOneWidget);
      expect(find.text('Spotify 2 gün içinde yenileniyor.'), findsOneWidget);
      expect(s.notif.unreadCount, 2);

      await tester.tap(find.text('Tümünü okundu say'));
      await tester.pumpAndSettle();
      expect(s.notif.unreadCount, 0);
      expect(find.text('Tümünü okundu say'), findsNothing);
    });

    testWidgets('bildirime dokunmak okundu yapar ve aboneliği açar',
        (tester) async {
      final s = await pump(tester, [
        testSubscription('1', name: 'Netflix', daysUntilRenewal: 1),
      ]);
      await tester.tap(find.text('Netflix 1 gün içinde yenileniyor.'));
      await tester.pumpAndSettle();

      expect(s.notif.unreadCount, 0);
      expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
    });

    testWidgets('kaydırarak bildirim kapatılır', (tester) async {
      final s = await pump(tester, [
        testSubscription('1', name: 'Netflix', daysUntilRenewal: 1),
      ]);
      await tester.drag(find.byType(Dismissible), const Offset(-500, 0));
      await tester.pumpAndSettle();

      expect(s.notif.all, isEmpty);
      expect(find.text('Yeni bildirim yok'), findsOneWidget);
    });
  });
}
