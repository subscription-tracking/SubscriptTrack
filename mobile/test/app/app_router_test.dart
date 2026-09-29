// Gerçek AppRouter'ın oturum yönlendirmesi ve AuthenticatedShell (ShellRoute)
// sağlayıcı kapsamı için uçtan uca doğrulama.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/app/router/app_router.dart';
import 'package:subscript_track/app/shell/app_shell.dart';
import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/navigation/app_routes.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/core/services/app_lock_service.dart';
import 'package:subscript_track/core/services/notification_scheduler.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/auth/presentation/screens/login_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/privacy_policy_screen.dart';
import 'package:subscript_track/features/settings/presentation/settings_controller.dart';
import 'package:subscript_track/features/stats/presentation/screens/stats_screen.dart';

class _FakeAuth implements AuthDataSource {
  _FakeAuth(this.user);

  AppUser? user;

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      throw UnimplementedError();

  @override
  Future<AppUser> signIn({required String email, required String password}) =>
      throw UnimplementedError();

  @override
  Future<void> signOut() async => user = null;

  @override
  Future<void> deleteAccount(String email) async {}

  @override
  Future<void> sendPasswordResetEmail(String email) async {}

  @override
  Future<void> updatePassword(String newPassword) async {}

  @override
  Future<AppUser> updateDisplayName(String name) async => user!;
}

Widget _app(AuthController auth, SettingsController settings) {
  final router = AppRouter.create(auth);
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthController>.value(value: auth),
      ChangeNotifierProvider<SettingsController>.value(value: settings),
      InheritedProvider<AppPreferences>.value(value: settings),
      ChangeNotifierProvider<AppLockService>(create: (_) => AppLockService()),
      Provider<NotificationScheduler>.value(value: NoopNotificationScheduler()),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('oturum yokken giriş ekranına, yasal sayfaya erişim serbest',
      (tester) async {
    final auth = AuthController(repository: _FakeAuth(null));
    final settings = SettingsController();
    await tester.pumpWidget(_app(auth, settings));
    await auth.init();
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);

    final router = GoRouter.of(tester.element(find.byType(LoginScreen)));
    router.go(AppRoutes.privacyPolicy);
    await tester.pumpAndSettle();
    expect(find.byType(PrivacyPolicyScreen), findsOneWidget);

    // Korumalı bir yol oturum yokken girişe yönlendirilir.
    router.go(AppRoutes.stats);
    await tester.pumpAndSettle();
    expect(find.byType(LoginScreen), findsOneWidget);
  });

  testWidgets(
      'oturum açık kullanıcı /home ve alt rotalara ShellRoute sağlayıcılarıyla ulaşır',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final user = AppUser(
      id: 'user-1',
      email: 'test@example.com',
      createdAt: DateTime(2026),
    );
    final auth = AuthController(repository: _FakeAuth(user));
    final settings = SettingsController();
    await tester.pumpWidget(_app(auth, settings));
    await auth.init();
    await tester.pumpAndSettle();

    expect(find.byType(AppShell), findsOneWidget);

    final router = GoRouter.of(tester.element(find.byType(AppShell)));
    // Alt rota, AuthenticatedShell'in sağladığı controller'ı okuyabilmeli.
    unawaited(router.push(AppRoutes.stats));
    await tester.pumpAndSettle();
    expect(find.byType(StatsScreen), findsOneWidget);

    // Bilinmeyen abonelik id'si hata vermeden "bulunamadı" gösterir.
    unawaited(router.push(AppRoutes.subscription('yok')));
    await tester.pumpAndSettle();
    expect(find.text('Abonelik bulunamadı.'), findsOneWidget);

    // Girişli kullanıcı giriş yoluna giderse ana sayfaya döner.
    router.go(AppRoutes.login);
    await tester.pumpAndSettle();
    expect(find.byType(AppShell), findsOneWidget);
  });
}
