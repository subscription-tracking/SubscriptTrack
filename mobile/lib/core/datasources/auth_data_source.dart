import '../../../features/auth/domain/auth_models.dart';

abstract class AuthDataSource {
  Future<AppUser?> currentUser();
  Future<AppUser> signUp({required String email, required String password});
  Future<AppUser> signIn({required String email, required String password});
  Future<void> signOut();
  Future<void> deleteAccount(String email);

  /// Şifre sıfırlama e-postası gönderir.
  /// Local modda no-op (kullanıcıya sessizce başarılı gösterilir).
  Future<void> sendPasswordResetEmail(String email);

  /// Mevcut oturumun şifresini değiştirir (password recovery flow).
  /// Local modda [AuthException] fırlatır.
  Future<void> updatePassword(String newPassword);

  /// Kullanıcının görünen adını günceller.
  Future<AppUser> updateDisplayName(String name);
}

abstract interface class EmailUpdateDataSource {
  Future<AppUser> updateEmail(String email);
}

abstract interface class SocialAuthDataSource {
  Future<bool> signInWithProvider(String provider);
}

enum AuthStateEvent {
  passwordRecovery,
  userUpdated,
  signedIn,
  tokenRefreshed,
  signedOut,
}

/// Sağlayıcıdan (ör. Supabase) gelen oturum değişikliği. [user], olayın
/// oturum bilgisi taşımadığı durumlarda `null`'dır.
class AuthStateChange {
  const AuthStateChange(this.event, this.user);

  final AuthStateEvent event;
  final AppUser? user;
}

/// Oturum değişikliklerini canlı yayınlayan sağlayıcılar (ör. Supabase).
abstract interface class AuthStateDataSource {
  Stream<AuthStateChange> get authStateChanges;
}

/// Kayıt sonrası e-posta doğrulaması isteyen sağlayıcılar.
abstract interface class EmailConfirmationDataSource {
  bool get lastSignUpRequiresEmailConfirmation;
}
