// ignore_for_file: invalid_use_of_visible_for_testing_member
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:local_auth/local_auth.dart';
import 'package:subscript_track/core/services/app_lock_gate.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/features/settings/presentation/screens/app_lock_settings_screen.dart';

class _FakeLocalAuth implements LocalAuthentication {
  bool supported = true;
  bool canCheck = true;
  List<BiometricType> enrolled = [BiometricType.fingerprint];
  bool authResult = true;
  bool throwOnAuth = false;

  @override
  Future<bool> isDeviceSupported() async => supported;

  @override
  Future<bool> get canCheckBiometrics async => canCheck;

  @override
  Future<List<BiometricType>> getAvailableBiometrics() async => enrolled;

  // `authenticate` imzası platform arayüzü paketindeki tipleri kullanır;
  // doğrudan bağımlılık eklememek için noSuchMethod ile karşılanır.
  @override
  dynamic noSuchMethod(Invocation invocation) {
    if (invocation.memberName == #authenticate) {
      if (throwOnAuth) return Future<bool>.error(Exception('sensör hatası'));
      return Future<bool>.value(authResult);
    }
    return super.noSuchMethod(invocation);
  }
}

AppLockService _service(_FakeLocalAuth auth) => AppLockService(auth: auth);

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('AppLockSettingsScreen', () {
    Future<AppLockService> pump(
        WidgetTester tester, _FakeLocalAuth auth) async {
      await tester.binding.setSurfaceSize(const Size(400, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      final service = _service(auth);
      await service.load();
      await tester.pumpWidget(
        MaterialApp(home: AppLockSettingsScreen(service: service)),
      );
      return service;
    }

    testWidgets('kapalıyken PIN alanı görünür, süre seçenekleri gizli',
        (tester) async {
      await pump(tester, _FakeLocalAuth());
      expect(find.text('Kapalı'), findsOneWidget);
      expect(find.text('Yeni PIN'), findsOneWidget);
      expect(find.text('Kilit süresi'), findsNothing);
    });

    testWidgets('geçersiz PIN hata gösterir', (tester) async {
      final service = await pump(tester, _FakeLocalAuth());
      await tester.enterText(find.byType(TextField), '12');
      await tester.tap(find.text('PIN’i etkinleştir'));
      await tester.pumpAndSettle();

      expect(find.text('PIN 4-8 rakam olmalıdır'), findsOneWidget);
      expect(service.enabled, isFalse);
    });

    testWidgets('geçerli PIN kilidi etkinleştirir ve süre seçenekleri açılır',
        (tester) async {
      final service = await pump(tester, _FakeLocalAuth());
      await tester.enterText(find.byType(TextField), '1234');
      await tester.tap(find.text('PIN’i etkinleştir'));
      await tester.pumpAndSettle();

      expect(find.text('PIN kaydedildi'), findsOneWidget);
      expect(service.enabled, isTrue);
      expect(find.text('Arka plandan dönünce sorulur'), findsOneWidget);
      expect(find.text('Kilit süresi'), findsOneWidget);
      expect(find.text('Hemen'), findsOneWidget);
    });

    testWidgets('kilit süresi seçilir', (tester) async {
      final service = await pump(tester, _FakeLocalAuth());
      await service.setPin('1234');
      await tester.pumpAndSettle();

      await tester.tap(find.text('1 dakika sonra'));
      await tester.pumpAndSettle();
      expect(service.lockTimeout, const Duration(minutes: 1));
    });

    testWidgets('PIN kilidi kapatılır', (tester) async {
      final service = await pump(tester, _FakeLocalAuth());
      await service.setPin('1234');
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(SwitchListTile, 'PIN kilidi'));
      await tester.pumpAndSettle();
      expect(service.enabled, isFalse);
      expect(find.text('Yeni PIN'), findsOneWidget);
    });

    testWidgets('biyometrik kilit desteklenmiyorsa hata gösterilir',
        (tester) async {
      final auth = _FakeLocalAuth()..enrolled = [];
      final service = await pump(tester, auth);
      await service.setPin('1234');
      await tester.pumpAndSettle();

      await tester
          .tap(find.widgetWithText(SwitchListTile, 'Biyometrik kilit açma'));
      await tester.pumpAndSettle();

      expect(find.text('Bu cihazda kullanılabilir biyometri bulunamadı'),
          findsOneWidget);
      expect(service.biometricEnabled, isFalse);
    });

    testWidgets('biyometrik kilit desteklenen cihazda açılır', (tester) async {
      final service = await pump(tester, _FakeLocalAuth());
      await service.setPin('1234');
      await tester.pumpAndSettle();

      await tester
          .tap(find.widgetWithText(SwitchListTile, 'Biyometrik kilit açma'));
      await tester.pumpAndSettle();
      expect(service.biometricEnabled, isTrue);
    });

    testWidgets('PIN yokken biyometrik anahtar pasif', (tester) async {
      await pump(tester, _FakeLocalAuth());
      final tile = tester.widget<SwitchListTile>(
          find.widgetWithText(SwitchListTile, 'Biyometrik kilit açma'));
      expect(tile.onChanged, isNull);
    });
  });

  group('AppLockGate', () {
    Future<AppLockService> pump(
      WidgetTester tester, {
      _FakeLocalAuth? auth,
      bool withPin = true,
    }) async {
      final service = _service(auth ?? _FakeLocalAuth());
      if (withPin) await service.setPin('1234');
      await tester.pumpWidget(MaterialApp(
        home: AppLockGate(
          service: service,
          child: const Scaffold(body: Text('içerik')),
        ),
      ));
      await tester.pumpAndSettle();
      return service;
    }

    testWidgets('PIN yoksa içerik doğrudan görünür', (tester) async {
      await pump(tester, withPin: false);
      expect(find.text('içerik'), findsOneWidget);
      expect(find.text('Uygulama kilitli'), findsNothing);
    });

    testWidgets('PIN varken açılışta kilit ekranı örter', (tester) async {
      final service = _service(_FakeLocalAuth());
      await service.setPin('1234');
      final fresh = _service(_FakeLocalAuth());
      await tester.pumpWidget(MaterialApp(
        home: AppLockGate(
          service: fresh,
          child: const Scaffold(body: Text('içerik')),
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Uygulama kilitli'), findsOneWidget);
    });

    testWidgets('yanlış PIN hata gösterir, doğru PIN kilidi açar',
        (tester) async {
      final service = await pump(tester);
      service.lock();
      await tester.pumpAndSettle();
      expect(find.text('Uygulama kilitli'), findsOneWidget);

      await tester.enterText(find.byType(TextField), '0000');
      await tester.tap(find.text('Kilidi aç'));
      await tester.pumpAndSettle();
      expect(find.textContaining('PIN hatalı'), findsOneWidget);
      expect(service.locked, isTrue);

      await tester.enterText(find.byType(TextField), '1234');
      await tester.tap(find.text('Kilidi aç'));
      await tester.pumpAndSettle();
      expect(service.locked, isFalse);
      expect(find.text('Uygulama kilitli'), findsNothing);
    });

    testWidgets('biyometrik düğmesi kilidi açar', (tester) async {
      final service = await pump(tester);
      await service.setBiometricEnabled(true);
      service.lock();
      await tester.pumpAndSettle();

      await tester.tap(find.byType(TextButton));
      await tester.pumpAndSettle();
      expect(service.locked, isFalse);
    });

    testWidgets('arka plana geçince kilitlenir, öne dönünce kilit süresi işler',
        (tester) async {
      final service = await pump(tester);
      // Kapı açılışta load() ile kilitler; önce PIN ile açılır.
      expect(service.locked, isTrue);
      await service.verifyPin('1234');
      await tester.pumpAndSettle();
      expect(service.locked, isFalse);

      // Varsayılan kilit süresi 5 dakikadır: kısa geçişte kilitlenmez.
      expect(service.lockTimeout, const Duration(minutes: 5));
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      await tester.pumpAndSettle();
      expect(service.locked, isFalse, reason: '5 dk dolmadı');

      // "Hemen" seçilince arka plana geçer geçmez kilitlenir.
      await service.setLockTimeout(Duration.zero);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
      await tester.pumpAndSettle();
      expect(service.locked, isTrue);
    });
  });

  group('AppLockService.unlockWithBiometric', () {
    test('biyometrik kapalıysa false', () async {
      expect(await _service(_FakeLocalAuth()).unlockWithBiometric(), isFalse);
    });

    test('sensör hatası false döner ve kilit açılmaz', () async {
      final auth = _FakeLocalAuth()..throwOnAuth = true;
      final service = _service(auth);
      await service.setPin('1234');
      await service.setBiometricEnabled(true);
      service.lock();
      expect(await service.unlockWithBiometric(), isFalse);
      expect(service.locked, isTrue);
    });

    test('doğrulama reddedilirse kilit açılmaz', () async {
      final auth = _FakeLocalAuth()..authResult = false;
      final service = _service(auth);
      await service.setPin('1234');
      await service.setBiometricEnabled(true);
      service.lock();
      expect(await service.unlockWithBiometric(), isFalse);
      expect(service.locked, isTrue);
    });
  });
}
