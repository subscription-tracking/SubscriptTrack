import '../../../features/auth/domain/auth_models.dart';

abstract class AuthDataSource {
  Future<AppUser?> currentUser();
  Future<AppUser> signUp({required String email, required String password});
  Future<AppUser> signIn({required String email, required String password});
  Future<void> signOut();
  Future<void> deleteAccount(String email);
}
