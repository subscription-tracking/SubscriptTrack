import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/app/shell/app_shell.dart';
import 'package:subscript_track/app/theme/app_theme.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/notifications/presentation/notification_controller.dart';
import 'package:subscript_track/features/stats/presentation/screens/stats_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';

class _FakeRepo implements SubscriptionDataSource {
  _FakeRepo(this._items, {this.failLoads = false, this.pendingLoad});
  final List<Subscription> _items;
  bool failLoads;
  final Completer<List<Subscription>>? pendingLoad;

  @override
  Future<List<Subscription>> getAll(String userId) async {
    if (failLoads) throw const NetworkException('Ağ bağlantısı yok');
    if (pendingLoad != null) return pendingLoad!.future;
    return List.of(_items);
  }

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
  String currency = 'TRY',
  double amount = 100,
}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(amount),
      currency: currency,
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now().subtract(const Duration(days: 30)),
      nextRenewalDate: DateTime.now().add(Duration(days: daysUntilRenewal)),
      category: category,
      createdAt: DateTime.now(),
    );

Widget _embeddedShell(SubscriptionController controller) => MaterialApp(
      theme: AppTheme.dark,
      home: Scaffold(
        appBar: AppBar(title: const Text('İstatistikler')),
        body: StatsScreen(controller: controller, embedded: true),
        bottomNavigationBar: const SizedBox(height: 64),
      ),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  testWidgets('embedded screen renders stats inside the app shell',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 1800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final controller = SubscriptionController(
      userId: 'shell-user',
      repository: _FakeRepo([
        _sub('1', 'Netflix', daysUntilRenewal: 2),
        _sub('2', 'Spotify', daysUntilRenewal: 10),
        _sub('3', 'Cloud', daysUntilRenewal: 15),
        _sub('4', 'Video', daysUntilRenewal: 22),
      ]),
    );
    await controller.load();
    await tester.pumpWidget(_embeddedShell(controller));
    await tester.pumpAndSettle();

    expect(find.text('TAHMİNİ AYLIK ABONELİK GİDERİ'), findsOneWidget);
    expect(find.text('Aylık gider tahmini'), findsOneWidget);
    expect(find.text('3 Ay'), findsNothing);
    expect(find.text('Kategori Dağılımı'), findsOneWidget);
    expect(find.text('4 Aktif'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('AppShell provider tree renders stats after selecting its tab',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final auth = AuthController();
    final notifications = NotificationController();
    final controller = SubscriptionController(
      userId: 'actual-shell-user',
      repository: _FakeRepo([
        _sub('1', 'Netflix', daysUntilRenewal: 2),
        _sub('2', 'Spotify', daysUntilRenewal: 10),
        _sub('3', 'Cloud', daysUntilRenewal: 15),
        _sub('4', 'Video', daysUntilRenewal: 22),
      ]),
    );
    await controller.load();

    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: auth),
        ChangeNotifierProvider<NotificationController>.value(
          value: notifications,
        ),
        ChangeNotifierProvider<SubscriptionController>.value(
          value: controller,
        ),
      ],
      child: MaterialApp(theme: AppTheme.dark, home: const AppShell()),
    ));
    await tester.pumpAndSettle();
    await tester.tap(find.text('İstatistikler').last);
    await tester.pumpAndSettle();

    expect(find.text('TAHMİNİ AYLIK ABONELİK GİDERİ'), findsOneWidget);
    expect(find.text('4 Aktif'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(const SizedBox.shrink());
    auth.dispose();
    notifications.dispose();
    controller.dispose();
  });

  testWidgets('initial load shows progress and then renders stats',
      (tester) async {
    final pending = Completer<List<Subscription>>();
    final controller = SubscriptionController(
      userId: 'loading-user',
      repository: _FakeRepo([], pendingLoad: pending),
    );
    final load = controller.load();
    await tester.pumpWidget(_embeddedShell(controller));
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    pending.complete([_sub('loaded', 'Netflix', daysUntilRenewal: 8)]);
    await load;
    await tester.pumpAndSettle();
    expect(find.text('TAHMİNİ AYLIK ABONELİK GİDERİ'), findsOneWidget);
  });

  testWidgets('empty account gets a clear add-subscription action',
      (tester) async {
    final controller = SubscriptionController(
      userId: 'empty-user',
      repository: _FakeRepo([]),
    );
    await controller.load();
    await tester.pumpWidget(_embeddedShell(controller));

    expect(find.text('Henüz analiz yok'), findsOneWidget);
    expect(find.text('Abonelik ekle'), findsOneWidget);
  });

  testWidgets('multiple currencies stay separate and projection is labeled',
      (tester) async {
    final controller = SubscriptionController(
      userId: 'multi-currency-user',
      repository: _FakeRepo([
        _sub('try', 'Netflix', daysUntilRenewal: 8, amount: 200),
        _sub('usd', 'Cloud', daysUntilRenewal: 15, currency: 'USD', amount: 10),
      ]),
    );
    await controller.load();
    await tester.pumpWidget(_embeddedShell(controller));
    await tester.pumpAndSettle();

    expect(find.text('TRY'), findsOneWidget);
    expect(find.text('USD'), findsOneWidget);
    expect(find.text('Aktif aboneliklerinin aylık toplamı'), findsOneWidget);
    expect(find.textContaining('Geçmiş ödemeleri görüntülemek için'),
        findsOneWidget);
    expect(find.text('3 Ay'), findsNothing);
  });

  testWidgets('payment history shows recorded payments', (tester) async {
    final controller = SubscriptionController(
      userId: 'payments-user',
      repository: _FakeRepo([_sub('paid', 'Netflix', daysUntilRenewal: 8)]),
    );
    await controller.load();
    await controller.recordPayment(
      subscriptionId: 'paid',
      amount: Money.fromJson(100),
      currency: 'TRY',
      paidAt: DateTime(DateTime.now().year, DateTime.now().month - 1, 15),
    );
    await tester.pumpWidget(_embeddedShell(controller));
    await tester.pumpAndSettle();

    expect(find.text('Kaydedilen ödemeler'), findsOneWidget);
    expect(find.text('Aylık gider tahmini'), findsNothing);
    expect(find.text('3 Ay'), findsOneWidget);
    expect(find.byIcon(Icons.horizontal_rule_rounded), findsOneWidget);

    await tester.tap(find.text('12 Ay'));
    await tester.pumpAndSettle();
    const monthLabels = {
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Ağu',
      'Eyl',
      'Eki',
      'Kas',
      'Ara'
    };
    final renderedMonthLabels = tester.widgetList<Text>(
      find.byWidgetPredicate(
        (widget) => widget is Text && monthLabels.contains(widget.data),
      ),
    );
    expect(renderedMonthLabels, isNotEmpty);
    expect(renderedMonthLabels.every((label) => label.maxLines == 1), isTrue);
    expect(
        renderedMonthLabels.every((label) => label.softWrap == false), isTrue);
  });

  testWidgets('cached subscriptions remain visible with offline banner',
      (tester) async {
    final repo = _FakeRepo([_sub('cached', 'Netflix', daysUntilRenewal: 8)]);
    final controller = SubscriptionController(
      userId: 'offline-user',
      repository: repo,
    );
    await controller.load();
    repo.failLoads = true;
    await controller.load();
    await tester.pumpWidget(_embeddedShell(controller));
    await tester.pumpAndSettle();

    expect(controller.isOffline, isTrue);
    expect(find.textContaining('Çevrimdışı'), findsOneWidget);
    expect(find.text('TAHMİNİ AYLIK ABONELİK GİDERİ'), findsOneWidget);
  });

  testWidgets('load failure shows retry instead of blank content',
      (tester) async {
    final controller = SubscriptionController(
      userId: 'error-user',
      repository: _FakeRepo([], failLoads: true),
    );
    await controller.load();
    await tester.pumpWidget(_embeddedShell(controller));

    expect(find.text('Veriler yüklenemedi'), findsOneWidget);
    expect(find.text('Tekrar dene'), findsOneWidget);
  });
}
