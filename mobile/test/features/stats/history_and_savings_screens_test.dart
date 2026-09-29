import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/savings/presentation/screens/savings_screen.dart';
import 'package:subscript_track/features/stats/presentation/screens/payment_history_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/archived_subscriptions_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../../support/fake_subscription_repo.dart';
import '../../support/routed_app.dart';

Future<SubscriptionController> _controller(
  List<Subscription> subs, {
  FakeSubscriptionRepo? repo,
}) async {
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});
  final c = SubscriptionController(
    userId: 'u1',
    repository: repo ?? FakeSubscriptionRepo(subs),
  );
  await c.load();
  return c;
}

Future<void> _tall(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(420, 1200));
  addTearDown(() => tester.binding.setSurfaceSize(null));
}

void main() {
  group('PaymentHistoryScreen', () {
    Future<SubscriptionController> pump(WidgetTester tester,
        {List<Subscription>? subs}) async {
      await _tall(tester);
      final c = await _controller(subs ??
          [
            testSubscription('1', name: 'Netflix', amount: '100.00'),
            testSubscription('2', name: 'Spotify', amount: '40.00'),
            testSubscription('3',
                name: 'Arşivli', status: SubscriptionStatus.archived),
          ]);
      await tester
          .pumpWidget(MaterialApp(home: PaymentHistoryScreen(controller: c)));
      return c;
    }

    testWidgets('kayıt yokken boş durum gösterilir', (tester) async {
      await pump(tester);
      expect(find.text('Henüz manuel ödeme kaydı yok.'), findsOneWidget);
    });

    testWidgets('abonelik yoksa "Kayıt ekle" hiçbir şey açmaz', (tester) async {
      await pump(tester, subs: []);
      await tester.tap(find.text('Kayıt ekle'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme kaydı ekle'), findsNothing);
    });

    testWidgets('ödeme kaydı eklenir ve listelenir', (tester) async {
      final c = await pump(tester);

      await tester.tap(find.text('Kayıt ekle'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme kaydı ekle'), findsOneWidget);
      // İlk abonelik seçili, tutarı önerilir; arşivli abonelik listede yok.
      expect(find.widgetWithText(TextFormField, '100.00'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField), '125,50');
      await tester.tap(find.text('Kaydet'));
      await tester.pumpAndSettle();

      expect(c.paymentEvents, hasLength(1));
      expect(c.paymentEvents.single.amount, Money.parse('125.50'));
      expect(c.paymentEvents.single.subscriptionId, '1');
      expect(find.text('Netflix'), findsOneWidget);
      expect(find.text('₺125,50'), findsOneWidget);
    });

    testWidgets('abonelik değiştirilince tutar o aboneliğe göre önerilir',
        (tester) async {
      await pump(tester);
      await tester.tap(find.text('Kayıt ekle'));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(DropdownButtonFormField<Subscription>));
      await tester.pumpAndSettle();
      expect(find.text('Arşivli'), findsNothing);
      await tester.tap(find.text('Spotify').last);
      await tester.pumpAndSettle();

      expect(find.widgetWithText(TextFormField, '40.00'), findsOneWidget);
    });

    testWidgets('geçersiz tutarlar reddedilir (1e2, 0, negatif, metin)',
        (tester) async {
      final c = await pump(tester);
      await tester.tap(find.text('Kayıt ekle'));
      await tester.pumpAndSettle();

      for (final bad in ['1e2', '0', '-5', 'abc', '']) {
        await tester.enterText(find.byType(TextFormField), bad);
        await tester.tap(find.text('Kaydet'));
        await tester.pump();
        expect(find.text('Geçerli tutar gir'), findsOneWidget, reason: bad);
      }
      expect(c.paymentEvents, isEmpty);
    });

    testWidgets('ekleme diyaloğu İptal ile kapanır', (tester) async {
      final c = await pump(tester);
      await tester.tap(find.text('Kayıt ekle'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('İptal'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme kaydı ekle'), findsNothing);
      expect(c.paymentEvents, isEmpty);
    });

    testWidgets('kayıt düzenlenir ve silinir', (tester) async {
      final c = await pump(tester);
      await c.recordPayment(
        subscriptionId: '1',
        amount: Money.parse('100'),
        currency: 'TRY',
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Düzenle'));
      await tester.pumpAndSettle();
      expect(find.text('Ödeme kaydını düzenle'), findsOneWidget);
      await tester.enterText(find.byType(TextFormField), '80');
      await tester.tap(find.text('Kaydet'));
      await tester.pumpAndSettle();
      expect(c.paymentEvents.single.amount, Money.parse('80'));

      await tester.tap(find.byTooltip('Sil'));
      await tester.pumpAndSettle();
      expect(c.paymentEvents, isEmpty);
      expect(find.text('Henüz manuel ödeme kaydı yok.'), findsOneWidget);
    });

    testWidgets('silinmiş aboneliğin kaydı "Silinmiş abonelik" gösterir',
        (tester) async {
      final c = await pump(tester);
      await c.recordPayment(
        subscriptionId: 'yok',
        amount: Money.parse('10'),
        currency: 'TRY',
      );
      await tester.pumpAndSettle();
      expect(find.text('Silinmiş abonelik'), findsOneWidget);
    });
  });

  group('SavingsScreen', () {
    Future<SubscriptionController> pump(
      WidgetTester tester,
      List<Subscription> subs, {
      FakeSubscriptionRepo? repo,
    }) async {
      await _tall(tester);
      final c = await _controller(subs, repo: repo);
      await tester.pumpWidget(MaterialApp(home: SavingsScreen(controller: c)));
      return c;
    }

    testWidgets('abonelik yoksa boş mesaj', (tester) async {
      await pump(tester, []);
      expect(find.text('Henüz abonelik yok.'), findsOneWidget);
    });

    testWidgets('en yüksek 3 aboneliğin iptal tasarrufu hesaplanır',
        (tester) async {
      await pump(tester, [
        testSubscription('1', name: 'A', amount: '100.00'),
        testSubscription('2', name: 'B', amount: '50.00'),
        testSubscription('3', name: 'C', amount: '30.00'),
        testSubscription('4', name: 'D', amount: '10.00'),
      ]);

      expect(find.text('En yüksek tutarlı 3 aboneliğini iptal edersen'),
          findsOneWidget);
      // (100 + 50 + 30) * 12 = 2160 yıllık, 180 aylık.
      expect(find.text('₺2.160,00/yıl tasarruf'), findsOneWidget);
      expect(find.text('₺180,00/ay'), findsOneWidget);
      expect(find.text('Tasarruf fırsatları'), findsOneWidget);
      expect(find.text('D'), findsOneWidget);
    });

    testWidgets('birden çok para biriminde her biri ayrı kartta',
        (tester) async {
      await pump(tester, [
        testSubscription('1', name: 'A', amount: '10.00'),
        testSubscription('2', name: 'B', amount: '5.00', currency: 'USD'),
      ]);
      expect(find.textContaining('3 TRY aboneliğini'), findsOneWidget);
      expect(find.textContaining('3 USD aboneliğini'), findsOneWidget);
    });

    testWidgets('iptal/duraklatma geçmişi listelenir', (tester) async {
      final repo = FakeSubscriptionRepo([
        testSubscription('1', name: 'A', amount: '100.00'),
        testSubscription('2', name: 'B', amount: '50.00'),
        testSubscription('3', name: 'C', amount: '20.00'),
      ]);
      final c = await pump(tester, [], repo: repo);
      await c.cancel('1');
      await c.pause('2');
      await c.load();
      await tester.pumpAndSettle();

      expect(find.text('İptal ve duraklatma geçmişi'), findsOneWidget);
      expect(find.text('Abonelik iptal edildi'), findsOneWidget);
      expect(find.text('Abonelik duraklatıldı'), findsOneWidget);
      expect(find.text('₺1.200,00/yıl'), findsWidgets);
    });

    testWidgets('yükleme hatasında mesaj ve tekrar dene', (tester) async {
      final repo = FakeSubscriptionRepo()..offline = true;
      await pump(tester, [], repo: repo);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);

      repo
        ..offline = false
        ..items.add(testSubscription('1', name: 'A'));
      await tester.tap(find.text('Tekrar dene'));
      await tester.pumpAndSettle();
      expect(find.text('Tasarruf fırsatları'), findsOneWidget);
    });
  });

  group('ArchivedSubscriptionsScreen', () {
    Future<SubscriptionController> pump(
        WidgetTester tester, List<Subscription> subs) async {
      await _tall(tester);
      final c = await _controller(subs);
      await tester.pumpWidget(routedApp(
        home: ArchivedSubscriptionsScreen(controller: c),
        providers: const [],
      ));
      await tester.pump();
      return c;
    }

    testWidgets('arşiv boşsa bilgi mesajı', (tester) async {
      await pump(tester, [testSubscription('1')]);
      expect(find.text('Arşivlenmiş abonelik yok'), findsOneWidget);
    });

    testWidgets('arşivlenen abonelikler listelenir', (tester) async {
      await pump(tester, [
        testSubscription('1',
            name: 'Eski', status: SubscriptionStatus.archived),
        testSubscription('2', name: 'Aktif'),
      ]);
      expect(find.text('Eski'), findsOneWidget);
      expect(find.text('Aktif'), findsNothing);
      expect(find.text('Aylık'), findsOneWidget);
    });

    testWidgets('"Aktif yap" aboneliği geri getirir', (tester) async {
      final c = await pump(tester, [
        testSubscription('1',
            name: 'Eski', status: SubscriptionStatus.archived),
      ]);
      await tester.tap(find.byTooltip('Aktif yap'));
      await tester.pumpAndSettle();

      expect(c.active.map((s) => s.id), ['1']);
      expect(find.text('Eski aktif aboneliklerine eklendi.'), findsOneWidget);
      expect(find.text('Arşivlenmiş abonelik yok'), findsOneWidget);
    });
  });
}
