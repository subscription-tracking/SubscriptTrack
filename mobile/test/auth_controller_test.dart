import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';

class _FakeAuthDataSource implements AuthDataSource {
  AppUser? user;

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signIn({required String email, required String password}) async {
    user = AppUser(
      id: 'user-1',
      email: email,
      createdAt: DateTime(2026),
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

  @override
  Future<void> updatePassword(String newPassword) async {}
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
}
