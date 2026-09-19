// S45 — küçük UX iyileştirmeleri: CSV şablon önizleme, takvim hızlı ekleme,
// ServiceIdentity.colorFor.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/calendar/presentation/screens/calendar_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/add_subscription_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/csv_import_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/shared/widgets/service_identity.dart';

class _EmptyRepo implements SubscriptionDataSource {
  @override
  Future<List<Subscription>> getAll(String userId) async => [];
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
  Future<Subscription> update(Subscription updated) =>
      throw UnimplementedError();
  @override
  Future<void> delete(String u, String id) => throw UnimplementedError();
  @override
  Future<void> archive(String u, String id) => throw UnimplementedError();
  @override
  Future<void> restore(String u, String id) => throw UnimplementedError();
  @override
  Future<void> pause(String u, String id) => throw UnimplementedError();
  @override
  Future<void> resume(String u, String id) => throw UnimplementedError();
  @override
  Future<void> cancel(String u, String id) => throw UnimplementedError();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(SystemChannels.platform, (call) async {
    if (call.method == 'Clipboard.setData') return null;
    return null;
  });

  group('S45 — CSV içe aktarma örnek format', () {
    testWidgets('örnek format dialogu beklenen sütun başlıklarını gösterir',
        (tester) async {
      final controller =
          SubscriptionController(userId: 'u1', repository: _EmptyRepo());

      await tester.pumpWidget(MaterialApp(
        home: CsvImportScreen(controller: controller),
      ));
      await tester.tap(find.text('Örnek format nasıl olmalı?'));
      await tester.pumpAndSettle();

      expect(find.textContaining('name, amount, currency'), findsOneWidget);
      expect(find.textContaining('Netflix'), findsWidgets);
    });

    testWidgets('panoya kopyala butonu dialogu kapatır ve onay gösterir',
        (tester) async {
      final controller =
          SubscriptionController(userId: 'u1', repository: _EmptyRepo());

      await tester.pumpWidget(MaterialApp(
        home: CsvImportScreen(controller: controller),
      ));
      await tester.tap(find.text('Örnek format nasıl olmalı?'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Panoya kopyala'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Örnek panoya kopyalandı.'), findsOneWidget);
    });
  });

  group('S45 — Takvimde seçili güne hızlı abonelik ekleme', () {
    testWidgets('boş günde "Bu güne abonelik ekle" AddSubscriptionScreen açar',
        (tester) async {
      final controller =
          SubscriptionController(userId: 'u1', repository: _EmptyRepo());
      await controller.load();

      await tester.pumpWidget(MaterialApp(
        home: ChangeNotifierProvider<SubscriptionController>.value(
          value: controller,
          child: const Scaffold(body: CalendarScreen()),
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Bu güne abonelik ekle'), findsOneWidget,
          reason: 'bugün seçili ve abonelik yok → hızlı ekleme butonu görünür');

      await tester.tap(find.text('Bu güne abonelik ekle'));
      await tester.pumpAndSettle();

      expect(find.byType(AddSubscriptionScreen), findsOneWidget);
    });
  });

  group('S45 — ServiceIdentity.colorFor', () {
    testWidgets('bilinen marka adı için tam eşleşen rengi döner',
        (tester) async {
      late Color color;
      await tester.pumpWidget(MaterialApp(
        home: Builder(builder: (context) {
          color = ServiceIdentity.colorFor(
              context, 'Netflix', SubscriptionCategory.streaming);
          return const SizedBox();
        }),
      ));

      expect(color, const Color(0xFFE50914));
    });

    testWidgets('bilinmeyen ad için kategori rengine düşer', (tester) async {
      late Color color;
      await tester.pumpWidget(MaterialApp(
        home: Builder(builder: (context) {
          color = ServiceIdentity.colorFor(
              context, 'Bilinmeyen Servis Adı', SubscriptionCategory.music);
          return const SizedBox();
        }),
      ));

      expect(color, const Color(0xFF49B8A8));
    });
  });
}
