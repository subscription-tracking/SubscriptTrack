import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/errors/app_exception.dart' as app_errors;
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';

class _FakeAuthDataSource implements AuthDataSource {
  AppUser? user;
  bool failSignIn = false;
  int signInCalls = 0;

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signIn(
      {required String email, required String password}) async {
    signInCalls++;
    if (failSignIn) {
      throw const app_errors.AuthException('E-posta veya şifre hatalı.');
    }
    user = AppUser(
      id: user?.id ?? 'user-1',
      email: email,
      displayName: user?.displayName,
      createdAt: user?.createdAt ?? DateTime(2026),
    );
    return user!;
  }

  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      signIn(email: email, password: password);

  @override
  Future<void> signOut() async => user = null;

  @override
  Future<void> deleteAccount(String email) async => user = null;

  @override
  Future<void> sendPasswordResetEmail(String email) async {}

  String? lastUpdatedPassword;

  @override
  Future<void> updatePassword(String newPassword) async {
    lastUpdatedPassword = newPassword;
  }

  @override
  Future<AppUser> updateDisplayName(String name) async {
    user = AppUser(
      id: user!.id,
      email: user!.email,
      displayName: name,
      createdAt: user!.createdAt,
    );
    return user!;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('auth controller restores and clears a session', () async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);

    await controller.init();
    expect(controller.status, AuthStatus.unauthenticated);

    expect(await controller.signIn('user@example.com', 'password'), isTrue);
    expect(controller.status, AuthStatus.authenticated);
    expect(controller.user?.email, 'user@example.com');

    await controller.signOut();
    expect(controller.status, AuthStatus.unauthenticated);
    expect(controller.user, isNull);
    controller.dispose();
  });

  test('updateDisplayName persists the new name on the current user', () async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);
    await controller.signIn('user@example.com', 'password');

    expect(await controller.updateDisplayName('Furkan Turan'), isTrue);
    expect(controller.user?.displayName, 'Furkan Turan');
    controller.dispose();
  });

  test('changePassword verifies the current password before updating',
      () async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);
    await controller.signIn('user@example.com', 'old-password');
    source.signInCalls = 0;

    final ok = await controller.changePassword(
      currentPassword: 'old-password',
      newPassword: 'new-password',
    );

    expect(ok, isTrue);
    expect(source.signInCalls, 1,
        reason: 'mevcut şifre signIn ile yeniden doğrulanır');
    expect(source.lastUpdatedPassword, 'new-password');
    controller.dispose();
  });

  test(
      'changePassword fails without calling updatePassword when the '
      'current password is wrong', () async {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
    final source = _FakeAuthDataSource();
    final controller = AuthController(repository: source);
    await controller.signIn('user@example.com', 'old-password');

    source.failSignIn = true;
    final ok = await controller.changePassword(
      currentPassword: 'wrong-password',
      newPassword: 'new-password',
    );

    expect(ok, isFalse);
    expect(source.lastUpdatedPassword, isNull,
        reason: 'yanlış mevcut şifreyle yeni şifre asla yazılmamalı');
    expect(controller.error, isNotNull);
    controller.dispose();
  });
}
