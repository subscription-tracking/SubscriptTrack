import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';

/// Bellek içi, davranışı ayarlanabilir kimlik doğrulama kaynağı.
class FakeAuthDataSource implements AuthDataSource, EmailUpdateDataSource {
  FakeAuthDataSource({this.user, this.password = 'sifre123'});

  AppUser? user;
  String password;

  /// `null` değilse işlemler bu mesajla [AuthException] fırlatır.
  String? failWith;

  /// `null` değilse yalnızca [deleteAccount] bu mesajla başarısız olur.
  String? deleteFailure;
  int signOutCalls = 0;
  int deleteCalls = 0;
  int resetEmailCalls = 0;
  String? lastResetEmail;
  String? lastUpdatedPassword;

  void _maybeFail() {
    if (failWith != null) throw AuthException(failWith!);
  }

  @override
  Future<AppUser?> currentUser() async => user;

  @override
  Future<AppUser> signUp({
    required String email,
    required String password,
  }) async {
    _maybeFail();
    user =
        AppUser(id: 'user-1', email: email, createdAt: DateTime(2026, 1, 15));
    this.password = password;
    return user!;
  }

  @override
  Future<AppUser> signIn({
    required String email,
    required String password,
  }) async {
    _maybeFail();
    if (password != this.password) {
      throw const AuthException('E-posta veya şifre hatalı.');
    }
    return user ??=
        AppUser(id: 'user-1', email: email, createdAt: DateTime(2026, 1, 15));
  }

  @override
  Future<void> signOut() async {
    signOutCalls++;
    user = null;
  }

  @override
  Future<void> deleteAccount(String email) async {
    _maybeFail();
    if (deleteFailure != null) throw AuthException(deleteFailure!);
    deleteCalls++;
    user = null;
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    _maybeFail();
    resetEmailCalls++;
    lastResetEmail = email;
  }

  @override
  Future<void> updatePassword(String newPassword) async {
    _maybeFail();
    lastUpdatedPassword = newPassword;
    password = newPassword;
  }

  @override
  Future<AppUser> updateDisplayName(String name) async {
    _maybeFail();
    final u = user!;
    return user = AppUser(
      id: u.id,
      email: u.email,
      displayName: name,
      createdAt: u.createdAt,
    );
  }

  @override
  Future<AppUser> updateEmail(String email) async {
    _maybeFail();
    final u = user!;
    return user = AppUser(
      id: u.id,
      email: email,
      displayName: u.displayName,
      createdAt: u.createdAt,
    );
  }
}

/// Oturum açmış bir kullanıcıyla başlatılmış [AuthController] döner.
Future<({AuthController auth, FakeAuthDataSource source})> signedInAuth({
  String email = 'kisi@example.com',
  String? displayName,
}) async {
  SharedPreferences.setMockInitialValues({'onboarding_done': true});
  final source = FakeAuthDataSource(
    user: AppUser(
      id: 'user-1',
      email: email,
      displayName: displayName,
      createdAt: DateTime(2026, 1, 15),
    ),
  );
  final auth = AuthController(repository: source);
  await auth.init();
  return (auth: auth, source: source);
}
