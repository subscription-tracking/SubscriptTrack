import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/errors/app_exception.dart' as app_errors;
import 'package:subscript_track/core/storage/local_storage.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';

// ── Fake repos ───────────────────────────────────────────────────

class _FakeAuthRepo implements AuthDataSource {
  AppUser? _current;
  bool failSignIn = false;

  void setUser(AppUser u) => _current = u;

  @override
  Future<AppUser?> currentUser() async => _current;

  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      throw UnimplementedError();

  @override
  Future<AppUser> signIn(
      {required String email, required String password}) async {
    if (failSignIn) throw const app_errors.AuthException('Giriş başarısız.');
    _current = AppUser(id: 'u1', email: email, createdAt: DateTime(2024));
    return _current!;
  }

  @override
  Future<void> signOut() async => _current = null;

  @override
  Future<void> deleteAccount(String email) async => _current = null;

  @override
  Future<void> sendPasswordResetEmail(String email) async {}

  @override
  Future<void> updatePassword(String newPassword) async {}

  @override
  Future<AppUser> updateDisplayName(String name) async {
    _current = AppUser(
      id: _current!.id,
      email: _current!.email,
      displayName: name,
      createdAt: _current!.createdAt,
    );
    return _current!;
  }
}

// ── Helpers ──────────────────────────────────────────────────────

AppUser _user({String id = 'u1', String email = 'a@b.com'}) =>
    AppUser(id: id, email: email, createdAt: DateTime(2024));

// ── Tests ────────────────────────────────────────────────────────

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('AuthController — session restore (S9)', () {
    test('init() → kullanıcı varsa authenticated döner', () async {
      final repo = _FakeAuthRepo()..setUser(_user());
      final ctrl = AuthController(repository: repo);
      final result = await ctrl.init();
      expect(result, isTrue);
      expect(ctrl.status, AuthStatus.authenticated);
      expect(ctrl.user?.id, 'u1');
      expect(ctrl.initialized, isTrue);
    });

    test('init() → kullanıcı yoksa unauthenticated döner', () async {
      final repo = _FakeAuthRepo();
      final ctrl = AuthController(repository: repo);
      final result = await ctrl.init();
      expect(result, isFalse);
      expect(ctrl.status, AuthStatus.unauthenticated);
      expect(ctrl.initialized, isTrue);
    });
  });

  group('AuthController — signIn / signOut (S9)', () {
    test('signIn başarılı → authenticated', () async {
      final repo = _FakeAuthRepo();
      final ctrl = AuthController(repository: repo);
      final ok = await ctrl.signIn('a@b.com', '123456');
      expect(ok, isTrue);
      expect(ctrl.status, AuthStatus.authenticated);
      expect(ctrl.error, isNull);
    });

    test('signIn hatalı → error set, status değişmez', () async {
      final repo = _FakeAuthRepo()..failSignIn = true;
      final ctrl = AuthController(repository: repo);
      final ok = await ctrl.signIn('a@b.com', 'yanlış');
      expect(ok, isFalse);
      expect(ctrl.error, isNotNull);
    });

    test('signOut → unauthenticated', () async {
      final repo = _FakeAuthRepo()..setUser(_user());
      final ctrl = AuthController(repository: repo);
      await ctrl.init();
      await ctrl.signOut();
      expect(ctrl.status, AuthStatus.unauthenticated);
      expect(ctrl.user, isNull);
    });
  });

  group('AuthController — deleteAccount local temizlik (S9)', () {
    test('deleteAccount → subscription cache temizlenir', () async {
      // Test 58 düzeltmesi sonrası: abonelik önbelleği artık SharedPreferences
      // değil, şifreli depolamada (FlutterSecureStorage) tutuluyor.
      SharedPreferences.setMockInitialValues({
        'notif_read_ids': ['n1'],
      });
      FlutterSecureStorage.setMockInitialValues({
        'subscriptions_u1': '[{"id":"sub1"}]',
      });

      final repo = _FakeAuthRepo()..setUser(_user());
      final ctrl = AuthController(repository: repo);
      await ctrl.init();

      await ctrl.deleteAccount(LocalStorage.instance);

      final storedSecure =
          await const FlutterSecureStorage().read(key: 'subscriptions_u1');
      final stored = await SharedPreferences.getInstance();
      expect(storedSecure, isNull);
      expect(stored.getStringList('notif_read_ids'), isNull);
      expect(ctrl.status, AuthStatus.unauthenticated);
      expect(ctrl.user, isNull);
    });

    test('deleteAccount → user null ise erken çıkar (status değişmez)',
        () async {
      final repo = _FakeAuthRepo();
      final ctrl = AuthController(repository: repo);
      // user null, deleteAccount erken çıkmalı — exception fırlatmamalı
      await expectLater(
        ctrl.deleteAccount(LocalStorage.instance),
        completes,
      );
    });
  });

  group('AuthController — clearError (S9)', () {
    test('clearError → error null olur', () async {
      final repo = _FakeAuthRepo()..failSignIn = true;
      final ctrl = AuthController(repository: repo);
      await ctrl.signIn('a@b.com', 'x');
      expect(ctrl.error, isNotNull);
      ctrl.clearError();
      expect(ctrl.error, isNull);
    });
  });
}
