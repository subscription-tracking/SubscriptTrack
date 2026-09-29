import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/navigation/app_routes.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/edit_subscription_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

import '../../support/fake_subscription_repo.dart';
import '../../support/routed_app.dart';

/// Ana sayfadan gerçek rota ile detay ekranını açar (geri dönüşü test etmek
/// için detay, ana sayfanın üstüne itilir).
Future<SubscriptionController> _open(
  WidgetTester tester,
  List<Subscription> subs,
) async {
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});
  await tester.binding.setSurfaceSize(const Size(420, 2000));
  addTearDown(() => tester.binding.setSurfaceSize(null));

  final controller = SubscriptionController(
    userId: 'u1',
    repository: FakeSubscriptionRepo(subs),
  );
  await controller.load();
  await tester.pumpWidget(routedApp(
    home: Builder(
      builder: (context) => Scaffold(
        body: TextButton(
          onPressed: () => context.push(AppRoutes.subscription(subs.first.id)),
          child: const Text('aç'),
        ),
      ),
    ),
    providers: [
      ChangeNotifierProvider<SubscriptionController>.value(value: controller),
    ],
  ));
  await tester.tap(find.text('aç'));
  await tester.pumpAndSettle();
  return controller;
}

/// Üst çubuktaki üç nokta menüsünden bir öğe seçer.
Future<void> _openMenuItem(WidgetTester tester, String label) async {
  await tester.tap(find.byIcon(Icons.more_vert_rounded));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label).last);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('ad, tutar ve bölümler gösterilir', (tester) async {
    await _open(tester, [
      testSubscription('1', name: 'Netflix', amount: '149.99'),
    ]);

    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
    expect(find.text('Netflix'), findsWidgets);
    expect(find.text('GEÇMİŞ ÖDEMELER'), findsOneWidget);
    expect(find.text('Henüz ödeme geçmişi yok'), findsOneWidget);
    expect(find.text('Duraklat'), findsOneWidget);
  });

  testWidgets('açık detay ekranı controller değişikliklerini yansıtır',
      (tester) async {
    final c = await _open(tester, [testSubscription('1', name: 'Netflix')]);
    expect(find.text('Netflix'), findsWidgets);

    await c.edit(c.allItems.single.copyWith(name: 'Netflix Premium'));
    await tester.pumpAndSettle();

    expect(find.text('Netflix Premium'), findsWidgets);
    expect(find.text('Netflix'), findsNothing);
  });

  testWidgets('kayıtlı ödemeler listelenir ve "Tümünü gör" diyaloğu açılır',
      (tester) async {
    final c = await _open(tester, [testSubscription('1', name: 'Netflix')]);
    for (final amount in ['10.00', '20.00', '30.00']) {
      await c.recordPayment(
        subscriptionId: '1',
        amount: Money.parse(amount),
        currency: 'TRY',
      );
    }
    await tester.pumpAndSettle();
    // Önizlemede yalnızca ilk iki ödeme görünür.
    expect(find.text('ÖDENDİ'), findsNWidgets(2));

    await tester.tap(find.text('Tümünü gör'));
    await tester.pumpAndSettle();
    expect(find.text('Geçmiş ödemeler'), findsOneWidget);
    expect(find.text('₺10,00'), findsWidgets);
    expect(find.text('₺30,00'), findsWidgets);
  });

  testWidgets('ödeme yokken "Tümünü gör" pasif', (tester) async {
    await _open(tester, [testSubscription('1')]);
    final button = tester
        .widget<TextButton>(find.widgetWithText(TextButton, 'Tümünü gör'));
    expect(button.onPressed, isNull);
  });

  testWidgets('Duraklat aboneliği duraklatır ve geri döner', (tester) async {
    final c = await _open(tester, [testSubscription('1')]);
    await tester.tap(find.text('Duraklat'));
    await tester.pumpAndSettle();

    expect(c.paused.single.id, '1');
    expect(find.byType(SubscriptionDetailScreen), findsNothing);
    expect(find.text('aç'), findsOneWidget);
  });

  testWidgets('duraklatılmış abonelikte "Devam Ettir" sürdürür',
      (tester) async {
    final c = await _open(
        tester, [testSubscription('1', status: SubscriptionStatus.paused)]);
    expect(find.text('Devam Ettir'), findsOneWidget);
    await tester.tap(find.text('Devam Ettir'));
    await tester.pumpAndSettle();
    expect(c.active.single.id, '1');
  });

  testWidgets('İptal Et ve Arşivle durumu değiştirir', (tester) async {
    final c = await _open(tester, [testSubscription('1')]);
    await tester.tap(find.textContaining('İptal'));
    await tester.pumpAndSettle();
    expect(c.cancelled.single.id, '1');
  });

  testWidgets('arşivle', (tester) async {
    final c = await _open(tester, [testSubscription('1')]);
    await tester.tap(find.textContaining('Arşiv'));
    await tester.pumpAndSettle();
    expect(c.archived.single.id, '1');
  });

  testWidgets('silme onay ister; vazgeçilirse silinmez', (tester) async {
    final c = await _open(tester, [testSubscription('1', name: 'Netflix')]);
    await _openMenuItem(tester, 'Sil');
    expect(find.text('Aboneliği sil'), findsOneWidget);
    expect(find.textContaining('kalıcı olarak silinecek'), findsOneWidget);

    await tester.tap(find.text('İptal').last);
    await tester.pumpAndSettle();
    expect(c.allItems, hasLength(1));
    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
  });

  testWidgets('silme onaylanınca abonelik kaldırılır', (tester) async {
    final c = await _open(tester, [testSubscription('1', name: 'Netflix')]);
    await _openMenuItem(tester, 'Sil');
    await tester.tap(find.text('Kalıcı olarak sil'));
    await tester.pumpAndSettle();

    expect(c.allItems, isEmpty);
    expect(find.byType(SubscriptionDetailScreen), findsNothing);
  });

  testWidgets('vadesi gelen abonelikte "Ödendi ve yenilendi" ödeme kaydeder',
      (tester) async {
    final c = await _open(tester, [
      testSubscription('1', amount: '50.00', daysUntilRenewal: 0),
    ]);
    final before = c.active.single.nextRenewalDate;
    expect(find.text('Ödendi ve yenilendi'), findsOneWidget);

    await tester.tap(find.text('Ödendi ve yenilendi'));
    await tester.pumpAndSettle();

    expect(c.paymentEvents.single.amount, Money.parse('50'));
    expect(c.allItems.single.nextRenewalDate.isAfter(before), isTrue);
    expect(find.byType(SubscriptionDetailScreen), findsNothing);
  });

  testWidgets('vadesi gelmemiş abonelikte yenileme düğmesi yok',
      (tester) async {
    await _open(tester, [testSubscription('1', daysUntilRenewal: 12)]);
    expect(find.text('Ödendi ve yenilendi'), findsNothing);
  });

  testWidgets('ödeme yöntemi ve hatırlatma bölümleri düzenleme ekranını açar',
      (tester) async {
    await _open(tester, [testSubscription('1', paymentMethod: 'Kredi Kartı')]);
    await tester.tap(find.text('Değiştir'));
    await tester.pumpAndSettle();
    expect(find.byType(EditSubscriptionScreen), findsOneWidget);
  });
}
