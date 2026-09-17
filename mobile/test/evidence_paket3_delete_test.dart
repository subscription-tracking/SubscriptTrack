// PAKET 3 — Silme & Toplu İşlemler: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 18, 19, 20, 21 numaralı senaryoları GERÇEK
// proje kodu (subscription_detail_screen.dart, subscription_controller.dart)
// üzerinden çalıştırıp assert eder.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_detail_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_list_screen.dart';

class _FakeRepo implements SubscriptionDataSource {
  final List<Subscription> _data;
  final List<String> deleteCalls = [];
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
  Future<void> delete(String userId, String subscriptionId) async {
    deleteCalls.add(subscriptionId);
    _data.removeWhere((s) => s.id == subscriptionId);
  }

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

Subscription _sub(String id, String name) => Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(100),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now().add(const Duration(days: 30)),
      nextRenewalDate: DateTime.now().add(const Duration(days: 30)),
      category: SubscriptionCategory.streaming,
      createdAt: DateTime.now(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  group('TEST 18 — Tek bir aboneliği silme', () {
    testWidgets('Menüden Sil -> onay dialogunda Sil -> controller.delete çağrılır, liste güncellenir', (tester) async {
      final sub = _sub('1', 'Netflix');
      final repo = _FakeRepo([sub]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.pumpWidget(MaterialApp(
        home: SubscriptionDetailScreen(subscription: sub, controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sil'));
      await tester.pumpAndSettle();

      expect(find.text('Aboneliği sil'), findsOneWidget,
          reason: 'Onay dialogu gösterildi.');

      // Dialogdaki "Sil" butonu (menüdekinden farklı, dialog içinde).
      await tester.tap(find.text('Sil').last);
      await tester.pumpAndSettle();

      expect(repo.deleteCalls, ['1'], reason: 'repo.delete tam olarak bir kez, doğru id ile çağrıldı.');
      expect(controller.allItems, isEmpty, reason: 'Abonelik listeden kaldırıldı ve tekrar görüntülenmiyor.');
    });
  });

  group('TEST 19 — Silme işlemini onaylamadan vazgeçme', () {
    testWidgets('Menüden Sil -> onay dialogunda İptal -> hiçbir şey silinmez', (tester) async {
      final sub = _sub('1', 'Netflix');
      final repo = _FakeRepo([sub]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.pumpWidget(MaterialApp(
        home: SubscriptionDetailScreen(subscription: sub, controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.more_vert_rounded));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sil'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('İptal'));
      await tester.pumpAndSettle();

      expect(repo.deleteCalls, isEmpty, reason: 'repo.delete hiç çağrılmadı.');
      expect(controller.allItems.length, 1, reason: 'Abonelik listede kalmaya devam ediyor.');
    });
  });

  group('TEST 20 — Silinen aboneliğe ait planlanmış hatırlatmanın iptali', () {
    test('Silinen abonelik controller.active listesinden de kalkıyor '
        '(AuthenticatedShell bu listeyi LocalNotificationService.scheduleRenewalReminders\'a besliyor, '
        'dolayısıyla silinen abonelik için yeniden planlama yapılmıyor)', () async {
      final sub1 = _sub('1', 'Netflix');
      final sub2 = _sub('2', 'Spotify');
      final repo = _FakeRepo([sub1, sub2]);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();
      expect(controller.active.map((s) => s.id), containsAll(['1', '2']));

      var notifiedActiveIds = <String>[];
      controller.addListener(() {
        notifiedActiveIds = controller.active.map((s) => s.id).toList();
      });

      await controller.delete('1');

      expect(notifiedActiveIds, ['2'],
          reason: 'notifyListeners() tetiklendiğinde (AuthenticatedShell\'in dinlediği an) '
              'silinen abonelik artık active listesinde YOK — bir sonraki reschedule çağrısı '
              'onun bildirimini içermeyecek.');
    });
  });

  group('TEST 21 — Birden fazla aboneliği toplu silme', () {
    test('FIXED (controller): deleteMany birden fazla id\'yi tek seferde siler, '
        'geriye kalanlar tek notifyListeners ile yansır', () async {
      final subs = [_sub('1', 'Netflix'), _sub('2', 'Spotify'), _sub('3', 'iCloud')];
      final repo = _FakeRepo(subs);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      var notifyCount = 0;
      controller.addListener(() => notifyCount++);

      await controller.deleteMany(['1', '3']);

      expect(repo.deleteCalls, containsAll(['1', '3']));
      expect(controller.allItems.map((s) => s.id), ['2']);
      expect(notifyCount, 1,
          reason: 'Her id için ayrı değil, tüm silmeler bitince TEK bir '
              'notifyListeners çağrısı yapıldı ("tek seferde silinir").');
    });

    testWidgets('FIXED (UI): bir kartı uzun basma seçim modunu açar, birden '
        'fazla kart seçilip "Sil" ile onaylanınca hepsi tek seferde siliniyor', (tester) async {
      final subs = [_sub('1', 'Netflix'), _sub('2', 'Spotify'), _sub('3', 'iCloud')];
      final repo = _FakeRepo(subs);
      final controller = SubscriptionController(userId: 'u1', repository: repo);
      await controller.load();

      await tester.pumpWidget(MaterialApp(
        home: ChangeNotifierProvider<SubscriptionController>.value(
          value: controller,
          child: const SubscriptionListScreen(),
        ),
      ));
      await tester.pumpAndSettle();
      // "Aktif" sekmesine geç.
      await tester.tap(find.text('Aktif (3)'));
      await tester.pumpAndSettle();

      // Netflix kartına uzun bas -> seçim modu açılır.
      await tester.longPress(find.text('Netflix'));
      await tester.pumpAndSettle();
      expect(find.text('1 seçildi'), findsOneWidget);

      // Spotify kartına da normal dokunuş -> seçim moduna eklenir.
      await tester.tap(find.text('Spotify'));
      await tester.pumpAndSettle();
      expect(find.text('2 seçildi'), findsOneWidget);

      await tester.tap(find.text('Sil'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Sil').last); // onay dialogundaki buton
      await tester.pumpAndSettle();

      expect(controller.allItems.map((s) => s.id), ['3'],
          reason: 'Netflix ve Spotify tek işlemle silindi, iCloud listede kaldı.');
    });
  });
}
