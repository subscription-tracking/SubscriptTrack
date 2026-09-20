import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/auth/presentation/screens/login_screen.dart';

class _FakeAuthDataSource implements AuthDataSource {
  AppUser? user;
  int signInCalls = 0;

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signIn(
      {required String email, required String password}) async {
    signInCalls++;
    user = AppUser(id: 'user-1', email: email, createdAt: DateTime(2026));
    return user!;
  }

  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      signIn(email: email, password: password);

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

  Future<void> pumpTall(WidgetTester tester, Widget widget) async {
    await tester.binding.setSurfaceSize(const Size(400, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(widget);
  }

  testWidgets('geçerli bilgilerle Giriş yap signIn çağırır', (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await pumpTall(
        tester, MaterialApp(home: LoginScreen(controller: controller)));
    await tester.pump();

    await tester.enterText(
        find.byType(TextFormField).at(0), 'test@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'password1');
    await tester.tap(find.widgetWithText(FilledButton, 'Giriş yap'));
    await tester.pumpAndSettle();

    expect(source.signInCalls, 1);
  });

  testWidgets('geçersiz e-posta ile signIn çağrılmaz', (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await pumpTall(
        tester, MaterialApp(home: LoginScreen(controller: controller)));
    await tester.pump();

    await tester.enterText(find.byType(TextFormField).at(0), 'gecersiz');
    await tester.enterText(find.byType(TextFormField).at(1), 'password1');
    await tester.tap(find.widgetWithText(FilledButton, 'Giriş yap'));
    await tester.pump();

    expect(find.text('Geçerli bir e-posta gir'), findsOneWidget);
    expect(source.signInCalls, 0);
  });

  testWidgets('"Test hesabıyla gir" test hesabı bilgileriyle signIn çağırır',
      (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await pumpTall(
        tester, MaterialApp(home: LoginScreen(controller: controller)));
    await tester.pump();

    await tester.tap(find.text('Test hesabıyla gir'));
    await tester.pumpAndSettle();

    expect(source.signInCalls, 1);
    expect(source.user?.email, 'testkullanici@subscripttrack.app');
  });

  testWidgets('"Hesabın yok mu? Kayıt ol" onRegisterTap çağırır',
      (tester) async {
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);
    var tapped = false;

    await pumpTall(
        tester,
        MaterialApp(
          home: LoginScreen(
            controller: controller,
            onRegisterTap: () => tapped = true,
          ),
        ));
    await tester.pump();

    await tester.tap(find.text('Hesabın yok mu? Kayıt ol'));
    await tester.pump();

    expect(tapped, isTrue);
  });
}
