// S46 — ana sayfa sadeleştirmesi: tam "yaklaşan ödemeler" listesi yerine tek
// "sıradaki ödeme" kartı, tam "kategoriler" listesi yerine özet donut kartı.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:subscript_track/features/stats/presentation/screens/stats_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _FakeAuthDataSource implements AuthDataSource {
  @override
  Future<AppUser?> currentUser() async => null;
  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      throw UnimplementedError();
  @override
  Future<AppUser> signIn({required String email, required String password}) =>
      throw UnimplementedError();
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount(String email) async {}
  @override
  Future<void> sendPasswordResetEmail(String email) async {}
  @override
  Future<void> updatePassword(String newPassword) async {}
  @override
  Future<AppUser> updateDisplayName(String name) => throw UnimplementedError();
}

class _FakeRepo implements SubscriptionDataSource {
  _FakeRepo(this._items);
  final List<Subscription> _items;

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_items);
  @override
  Future<Subscription> create({
    required String userId,
    required String name,
    required Money amount,
    required String currency,
    required BillingCycle billingCycle,
    required DateTime startDate,
    required DateTime nextRenewalDate,
    required SubscriptionCategory category,
    String? notes,
    String? paymentMethod,
    DateTime? trialEndDate,
    Money? trialPriceAfter,
  }) =>
      throw UnimplementedError();
  @override
  Future<Subscription> update(Subscription updated) async => updated;
  @override
  Future<void> delete(String u, String id) async {}
  @override
  Future<void> archive(String u, String id) async {}
  @override
  Future<void> restore(String u, String id) async {}
  @override
  Future<void> pause(String u, String id) async {}
  @override
  Future<void> resume(String u, String id) async {}
  @override
  Future<void> cancel(String u, String id) async {}
}

Subscription _sub(
  String id,
  String name, {
  required int daysUntilRenewal,
  SubscriptionCategory category = SubscriptionCategory.streaming,
  double amount = 100,
}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(amount),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now().subtract(const Duration(days: 30)),
      nextRenewalDate: DateTime.now().add(Duration(days: daysUntilRenewal)),
      category: category,
      createdAt: DateTime.now(),
    );

Widget _wrap(SubscriptionController controller) => MaterialApp(
      home: MultiProvider(
        providers: [
          ChangeNotifierProvider<SubscriptionController>.value(
              value: controller),
          ChangeNotifierProvider<AuthController>(
            create: (_) => AuthController(repository: _FakeAuthDataSource()),
          ),
        ],
        child: const Scaffold(body: DashboardScreen()),
      ),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  // Dashboard uzun bir liste; "Bu ayın görünümü" ve altındaki içerik
  // varsayılan 800x600 test yüzeyinde ilk viewport'un altında kalıp hiç
  // build edilmeyebilir — yüzeyi büyütüyoruz.
  Future<void> pumpTall(WidgetTester tester, Widget widget) async {
    await tester.binding.setSurfaceSize(const Size(400, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(widget);
  }

  testWidgets(
      'tam "Yaklaşan ödemeler" listesi yerine tek "Sıradaki ödeme" kartı gösterilir',
      (tester) async {
    final subs = [
      _sub('1', 'Netflix', daysUntilRenewal: 2),
      _sub('2', 'Spotify', daysUntilRenewal: 10),
      _sub('3', 'iCloud', daysUntilRenewal: 20),
    ];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();

    await pumpTall(tester, _wrap(controller));
    await tester.pumpAndSettle();

    expect(find.text('Sıradaki ödeme'), findsOneWidget);
    expect(find.text('Yaklaşan ödemeler'), findsNothing,
        reason: 'tam liste başlığı artık ana sayfada olmamalı');

    // Sadece en yakın tarihli (Netflix, 2 gün) gösterilmeli; diğer ikisi
    // (Spotify, iCloud) ne "sıradaki ödeme" kartında ne başka bir bölümde
    // görünmemeli.
    expect(find.text('Netflix'), findsOneWidget);
    expect(find.text('Spotify'), findsNothing);
    expect(find.text('iCloud'), findsNothing);
  });

  testWidgets('"Hatırlat" butonu ilgili aboneliğin detay ekranını açar',
      (tester) async {
    final subs = [_sub('1', 'Netflix', daysUntilRenewal: 2)];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();

    await pumpTall(tester, _wrap(controller));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Hatırlat'));
    await tester.pumpAndSettle();

    expect(find.byType(SubscriptionDetailScreen), findsOneWidget);
  });

  testWidgets(
      'tam kategori listesi yerine özet donut kartı ve yüzdeler gösterilir',
      (tester) async {
    final subs = [
      _sub('1', 'Netflix',
          daysUntilRenewal: 5,
          category: SubscriptionCategory.streaming,
          amount: 150),
      _sub('2', 'Spotify',
          daysUntilRenewal: 8,
          category: SubscriptionCategory.music,
          amount: 50),
    ];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();

    await pumpTall(tester, _wrap(controller));
    await tester.pumpAndSettle();

    expect(find.text('Bu ayın görünümü'), findsOneWidget);
    expect(find.text('Kategoriler'), findsNothing,
        reason: 'tam kategori bölüm başlığı artık ana sayfada olmamalı');
    expect(find.textContaining('%'), findsWidgets,
        reason: 'kategori yüzdeleri gösterilmeli');
  });

  testWidgets(
      '"Tüm kategoriler" onOpenStats verilmediğinde StatsScreen\'i push eder',
      (tester) async {
    final subs = [_sub('1', 'Netflix', daysUntilRenewal: 5)];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();

    await pumpTall(tester, _wrap(controller));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Tüm kategoriler'));
    await tester.pumpAndSettle();

    expect(find.byType(StatsScreen), findsOneWidget);
  });

  testWidgets(
      '"Tüm kategoriler" onOpenStats verildiğinde StatsScreen push etmez, '
      'callback\'i çağırır (navbar sekmesine geçiş)', (tester) async {
    final subs = [_sub('1', 'Netflix', daysUntilRenewal: 5)];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();
    var openStatsCalled = false;

    await pumpTall(
      tester,
      MaterialApp(
        home: MultiProvider(
          providers: [
            ChangeNotifierProvider<SubscriptionController>.value(
                value: controller),
            ChangeNotifierProvider<AuthController>(
              create: (_) => AuthController(repository: _FakeAuthDataSource()),
            ),
          ],
          child: Scaffold(
            body: DashboardScreen(
              onOpenStats: () => openStatsCalled = true,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Tüm kategoriler'));
    await tester.pumpAndSettle();

    expect(openStatsCalled, isTrue);
    expect(find.byType(StatsScreen), findsNothing,
        reason:
            'stats tabına geçiş callback ile yapılmalı, ayrı bir StatsScreen push edilmemeli');
  });

  testWidgets('ödeme kaydı olmayan aktif abonelikler için sayaç 0/N gösterir',
      (tester) async {
    final subs = [
      _sub('1', 'Netflix', daysUntilRenewal: 5),
      _sub('2', 'Spotify', daysUntilRenewal: 8),
    ];
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo(subs));
    await controller.load();

    await pumpTall(tester, _wrap(controller));
    await tester.pumpAndSettle();

    expect(find.text('0/2'), findsOneWidget);
  });
}
