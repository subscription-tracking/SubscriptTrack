// S44 — kayıt formunda KVKK/kullanım şartları onayı olmadan kayıt olunamaz.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/auth/presentation/screens/register_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/privacy_policy_screen.dart';
import 'package:subscript_track/features/settings/presentation/screens/terms_of_service_screen.dart';

class _FakeAuthDataSource implements AuthDataSource {
  AppUser? user;
  int signUpCalls = 0;

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signUp(
      {required String email, required String password}) async {
    signUpCalls++;
    user = AppUser(id: 'user-1', email: email, createdAt: DateTime(2026));
    return user!;
  }

  @override
  Future<AppUser> signIn({required String email, required String password}) =>
      signUp(email: email, password: password);

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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  Future<void> fillValidForm(WidgetTester tester) async {
    await tester.enterText(
        find.byType(TextFormField).at(0), 'test@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'password1');
    await tester.enterText(find.byType(TextFormField).at(2), 'password1');
  }

  testWidgets('onay kutusu işaretlenmeden Kayıt ol butonu pasif kalır',
      (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await tester.pumpWidget(
      MaterialApp(home: RegisterScreen(controller: controller)),
    );
    await fillValidForm(tester);
    await tester.pump();

    final button = tester
        .widget<FilledButton>(find.widgetWithText(FilledButton, 'Kayıt ol'));
    expect(button.onPressed, isNull,
        reason: 'onay kutusu işaretlenmeden kayıt olunamamalı');
    expect(source.signUpCalls, 0);
  });

  testWidgets(
      'onay kutusu işaretlenince Kayıt ol aktif olur ve signUp çağrılır',
      (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await tester.pumpWidget(
      MaterialApp(home: RegisterScreen(controller: controller)),
    );
    await fillValidForm(tester);
    await tester.tap(find.byType(Checkbox));
    await tester.pump();

    final button = tester
        .widget<FilledButton>(find.widgetWithText(FilledButton, 'Kayıt ol'));
    expect(button.onPressed, isNotNull);

    await tester.tap(find.widgetWithText(FilledButton, 'Kayıt ol'));
    await tester.pumpAndSettle();
    expect(source.signUpCalls, 1);
  });

  testWidgets('kullanım şartları linki ilgili ekranı açar', (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await tester.pumpWidget(
      MaterialApp(home: RegisterScreen(controller: controller)),
    );
    await tester.tap(find.text('kullanım şartlarını'));
    await tester.pumpAndSettle();

    expect(find.byType(TermsOfServiceScreen), findsOneWidget);
  });

  testWidgets('gizlilik politikası linki ilgili ekranı açar', (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await tester.pumpWidget(
      MaterialApp(home: RegisterScreen(controller: controller)),
    );
    await tester.tap(find.text('gizlilik politikasını'));
    await tester.pumpAndSettle();

    expect(find.byType(PrivacyPolicyScreen), findsOneWidget);
  });
}
