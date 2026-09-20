// PAKET 8 — Kullanılabilirlik/UI: kanıtlı inceleme
//
// Test Senaryoları Excel'indeki 49, 50, 51 numaralı senaryoları GERÇEK proje
// kodu üzerinden çalıştırıp assert eder.
//
// DÜZELTME (dürüstlük notu): Paket 5 raporunda "ayarlarda timezone alanı yok"
// demiştim — bu YANLIŞTI. appearance_screen.dart içinde _TimezoneTile adında
// gerçek bir saat dilimi seçici VAR ("Cihaz varsayılanı" dahil 12 seçenek).
// Paket 5'teki asıl düzeltme (tz.setLocalLocation ile cihaz saat diliminin
// gerçekten okunması) hâlâ geçerli ve gerekliydi — bu tile'ın "Cihaz
// varsayılanı" seçeneğinin DOĞRU çalışması tam olarak o düzeltmeye bağlıydı.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/app/theme/app_theme.dart';
import 'package:subscript_track/core/datasources/subscription_data_source.dart';
import 'package:subscript_track/core/domain/money.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';
import 'package:subscript_track/features/settings/presentation/screens/appearance_screen.dart';
import 'package:subscript_track/features/subscriptions/domain/subscription_models.dart';
import 'package:subscript_track/features/subscriptions/presentation/subscription_controller.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/add_subscription_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/screens/subscription_list_screen.dart';
import 'package:subscript_track/features/subscriptions/presentation/widgets/subscription_form.dart';

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

Subscription _sub(String id, String name, {double amount = 100}) =>
    Subscription(
      id: id,
      userId: 'u1',
      name: name,
      amount: Money.fromJson(amount),
      currency: 'TRY',
      billingCycle: BillingCycle.monthly,
      startDate: DateTime.now(),
      nextRenewalDate: DateTime.now().add(const Duration(days: 10)),
      category: SubscriptionCategory.streaming,
      createdAt: DateTime.now(),
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group(
      'TEST 49 — Karanlık/aydınlık tema geçişi (FIXED — gerçek açık/koyu/sistem tema desteği)',
      () {
    testWidgets(
        'MaterialApp themeMode: ThemeMode.light verildiğinde gerçekten '
        'AÇIK temayla render ediliyor (AppTheme.light artık kullanımda)',
        (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.light,
        home: const Scaffold(body: SizedBox()),
      ));

      final context = tester.element(find.byType(Scaffold));
      expect(Theme.of(context).brightness, Brightness.light);
    });

    testWidgets(
        'MaterialApp themeMode: ThemeMode.dark verildiğinde koyu temayla render ediliyor',
        (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: const Scaffold(body: SizedBox()),
      ));

      final context = tester.element(find.byType(Scaffold));
      expect(Theme.of(context).brightness, Brightness.dark);
    });

    testWidgets(
        'FIXED: setThemeMode(ThemeMode.light) artık GERÇEKTEN uygulanıyor '
        '(önceden sessizce ThemeMode.dark\'a sabitleniyordu)', (tester) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final settings = SettingsController.instance;
      await settings.load();

      await settings.setThemeMode(ThemeMode.light);
      expect(settings.themeMode, ThemeMode.light);

      await settings.setThemeMode(ThemeMode.system);
      expect(settings.themeMode, ThemeMode.system);

      await settings.setThemeMode(ThemeMode.dark);
      expect(settings.themeMode, ThemeMode.dark);
    });

    testWidgets(
        'FIXED: seçim kalıcı — kaydedilip tekrar load() edilince korunuyor',
        (tester) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final settings = SettingsController.instance;
      await settings.load();
      await settings.setThemeMode(ThemeMode.light);

      // Yeni bir "uygulama açılışı" simülasyonu: tekrar load() çağır.
      await settings.load();
      expect(settings.themeMode, ThemeMode.light,
          reason: 'Tema tercihi SharedPreferences\'a yazılıp doğru okunuyor.');

      await settings.setThemeMode(
          ThemeMode.dark); // sıradaki testleri etkilememek için sıfırla
    });

    testWidgets(
        'FIXED: AppearanceScreen artık "Sistem", "Aydınlık" VE "Karanlık" '
        'seçeneklerinin üçünü de gösteriyor', (tester) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final settings = SettingsController.instance;
      await settings.load();

      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        home: AppearanceScreen(controller: settings),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Sistem'), findsOneWidget);
      expect(find.text('Aydınlık'), findsOneWidget);
      expect(find.text('Karanlık'), findsOneWidget);
      expect(find.text('Açık tema geçici olarak kullanıma kapalıdır.'),
          findsNothing);
    });

    testWidgets(
        'FIXED: AppearanceScreen\'de "Aydınlık"a dokununca controller güncelleniyor',
        (tester) async {
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final settings = SettingsController.instance;
      await settings.load();
      await settings.setThemeMode(ThemeMode.dark);

      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        home: AppearanceScreen(controller: settings),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Aydınlık'));
      await tester.pumpAndSettle();

      expect(settings.themeMode, ThemeMode.light);
    });
  });

  group('TEST 50 — Farklı ekran boyutlarında görüntüleme', () {
    Future<void> pumpListAt(WidgetTester tester, Size size) async {
      await tester.binding.setSurfaceSize(size);
      addTearDown(() => tester.binding.setSurfaceSize(null));
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final repo = _FakeRepo([
        _sub('1', 'Netflix Premium Ailem İçin Uzun İsim', amount: 12345.67),
        _sub('2', 'Spotify'),
        _sub('3', 'iCloud+'),
      ]);
      final ctrl = SubscriptionController(userId: 'u1', repository: repo);
      await ctrl.load();
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        home: ChangeNotifierProvider<SubscriptionController>.value(
          value: ctrl,
          child: const SubscriptionListScreen(),
        ),
      ));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Aktif 3'));
      await tester.pumpAndSettle();
    }

    testWidgets(
        'FIXED — Küçük ekran (320x568, ör. iPhone SE) — taşma/overflow hatası yok',
        (tester) async {
      // Bu test önce GERÇEK bir bug buldu: boş "Deneme" sekmesindeki
      // AppEmptyState, dar+kısa ekranlarda dikey RenderFlex overflow
      // veriyordu (app_empty_state.dart:34, "63 pixels on the bottom").
      // Kök neden: sabit boyutlu Column, taşan içeriği kırpmak/kaydırmak
      // yerine hata veriyordu. Düzeltme: Column bir SingleChildScrollView'a
      // sarıldı — içerik sığmadığında artık HATA vermek yerine kayıyor.
      await pumpListAt(tester, const Size(320, 568));
      expect(tester.takeException(), isNull);
    });

    testWidgets('Büyük tablet ekranı (1024x1366) — taşma/overflow hatası yok',
        (tester) async {
      await pumpListAt(tester, const Size(1024, 1366));
      expect(tester.takeException(), isNull);
    });

    testWidgets(
        'FIXED — Abonelik ekleme formu küçük ekranda (360x640) taşma vermiyor',
        (tester) async {
      // Bu test de GERÇEK bir bug buldu: "Ödeme Yöntemi" dropdown'ındaki
      // "+ Yeni Kart Ekle..." menü satırı (subscription_form.dart), bir Row
      // içinde flex/ellipsis olmadan duruyordu — DropdownButton kapalı
      // haldeyken TÜM menü öğelerini (seçili olmasa bile) sınırlı genişlikte
      // bir IndexedStack'te layout ettiğinden 103px yatay taşma veriyordu.
      // Düzeltme üç parçalı: Row'a mainAxisSize: MainAxisSize.min (Flexible'ın
      // sınırsız genişlikte çökmesini önler), Text'e Flexible + ellipsis
      // (sınırlı genişlikte kırpma sağlar), ve metin "+ Yeni Kart" olarak
      // kısaltıldı (en dar pratik senaryoda bile doğal olarak sığsın diye).
      await tester.binding.setSurfaceSize(const Size(360, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      SharedPreferences.setMockInitialValues({});
      FlutterSecureStorage.setMockInitialValues({});
      final ctrl =
          SubscriptionController(userId: 'u1', repository: _FakeRepo([]));
      await ctrl.load();
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        home: AddSubscriptionScreen(controller: ctrl),
      ));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('TEST 51 — Fiyat alanı için uygun klavye tipi', () {
    testWidgets(
        'Tutar alanı ondalıklı SAYISAL klavye açıyor (harf tuşları değil)',
        (tester) async {
      final key = GlobalKey<FormState>();
      final data = SubscriptionFormData();
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.dark,
        home: Scaffold(
          body: SingleChildScrollView(
            child: SubscriptionForm(formKey: key, data: data),
          ),
        ),
      ));

      final amountEditable = tester.widget<EditableText>(find.descendant(
        of: find.byType(TextFormField).at(1),
        matching: find.byType(EditableText),
      ));
      expect(amountEditable.keyboardType,
          const TextInputType.numberWithOptions(decimal: true),
          reason:
              'Tutar alanı sayısal + ondalıklı klavye tipini açıkça talep ediyor.');
    });
  });
}
