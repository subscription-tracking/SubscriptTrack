// S43 — abonelik detay ekranındaki "Hatırlatmalar" bölümü kanıt testi.
//
// Subscription.notificationRules zaten desteklenen bir alan; bu test
// SubscriptionDetailScreen'in bu kuralları gerçekten okuyup gösterdiğini
// doğrular (önceden bu ekranda statik, abonelikten bağımsız bir metin vardı).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/notifications/domain/notification_rule.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  _FakeRepo(List<Subscription> data) : _data = List.of(data);

  @override
  Future<List<Subscription>> getAll(String userId) async => List.of(_data);

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
  }) async =>
      throw UnimplementedError();

  @override
  Future<Subscription> update(Subscription updated) async => updated;
  @override
  Future<void> delete(String userId, String subscriptionId) async {}
  @override
  Future<void> archive(String userId, String subscriptionId) async {}
  @override
  Future<void> restore(String userId, String subscriptionId) async {}
  @override
  Future<void> pause(String userId, String subscriptionId) async {}
  @override
  Future<void> resume(String userId, String subscriptionId) async {}
  @override
  Future<void> cancel(String userId, String subscriptionId) async {}
}

Subscription _sub(String id, List<NotificationRule> rules) => Subscription(
      id: id,
      userId: 'u1',
      name: 'Netflix',
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now().subtract(const Duration(days: 10)),
      nextRenewalDate: DateTime.now().add(const Duration(days: 20)),
      category: SubscriptionCategory.streaming,
      notificationRules: rules,
      createdAt: DateTime.now(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  // Detay ekranı uzun bir CustomScrollView; "Hatırlatmalar" bölümü
  // varsayılan 800x600 test yüzeyinde ilk viewport'un altında kalıp
  // sliver tarafından hiç build edilmeyebilir — yüzeyi büyütüyoruz.
  Future<void> pumpTall(WidgetTester tester, Widget widget) async {
    await tester.binding.setSurfaceSize(const Size(400, 2400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(widget);
  }

  testWidgets('birden fazla etkin kural gün etiketiyle chip olarak görünür',
      (tester) async {
    final sub = _sub('1', const [
      NotificationRule(daysBefore: 7),
      NotificationRule(daysBefore: 1),
      NotificationRule(daysBefore: 0),
    ]);
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo([sub]));
    await controller.load();

    await pumpTall(
      tester,
      MaterialApp(
        home:
            SubscriptionDetailScreen(subscription: sub, controller: controller),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('HATIRLATMALAR'), findsOneWidget);
    expect(find.text('7 gün önce'), findsOneWidget);
    expect(find.text('1 gün önce'), findsOneWidget);
    expect(find.text('Aynı gün'), findsOneWidget);
  });

  testWidgets('devre dışı bırakılmış kurallar gösterilmez', (tester) async {
    final sub = _sub('1', const [
      NotificationRule(daysBefore: 7, enabled: false),
      NotificationRule(daysBefore: 3),
    ]);
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo([sub]));
    await controller.load();

    await pumpTall(
      tester,
      MaterialApp(
        home:
            SubscriptionDetailScreen(subscription: sub, controller: controller),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('3 gün önce'), findsOneWidget);
    expect(find.text('7 gün önce'), findsNothing,
        reason: 'enabled:false kural listede görünmemeli');
  });

  testWidgets('hiç etkin kural yoksa kapalı olduğu belirtilir', (tester) async {
    final sub =
        _sub('1', const [NotificationRule(daysBefore: 3, enabled: false)]);
    final controller =
        SubscriptionController(userId: 'u1', repository: _FakeRepo([sub]));
    await controller.load();

    await pumpTall(
      tester,
      MaterialApp(
        home:
            SubscriptionDetailScreen(subscription: sub, controller: controller),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bu abonelik için hatırlatma kapalı.'), findsOneWidget);
  });
}
