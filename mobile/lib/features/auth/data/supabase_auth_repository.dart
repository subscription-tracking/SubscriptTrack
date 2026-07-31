import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../../../core/datasources/auth_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/auth_models.dart';

/// Supabase Auth tabanlı repository.
/// EnvironmentConfig.isSupabaseConfigured == true olduğunda AuthController bu sınıfı kullanır.
/// Token yenileme, session kalıcılığı ve güvenli depolama supabase_flutter tarafından otomatik yönetilir.
class SupabaseAuthRepository implements AuthDataSource {
  sb.SupabaseClient get _client => sb.Supabase.instance.client;

  @override
  Future<AppUser?> currentUser() async {
    final user = _client.auth.currentUser;
    return user != null ? _toAppUser(user) : null;
  }

  @override
  Future<AppUser> signUp({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signUp(
        email: email,
        password: password,
      );
      final user = response.user;
      if (user == null) throw const AuthException('Kayıt başarısız.');
      return _toAppUser(user);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  @override
  Future<AppUser> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      final user = response.user;
      if (user == null) throw const AuthException('Giriş başarısız.');
      return _toAppUser(user);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  @override
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  @override
  Future<void> deleteAccount(String email) async {
    // Hesap silme Sprint 7'de backend API ile tamamlanacak.
    // Şimdilik oturumu sonlandırır; backend DELETION_PENDING durumuna alır.
    await _client.auth.signOut();
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _client.auth.resetPasswordForEmail(email);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    }
  }

  // ─── Helpers ────────────────────────────────────────────────

  AppUser _toAppUser(sb.User user) => AppUser(
        id: user.id,
        email: user.email ?? '',
        displayName: user.userMetadata?['display_name'] as String?,
        createdAt: DateTime.parse(user.createdAt),
      );

  String _localizeError(String? message) {
    final m = message?.toLowerCase() ?? '';
    if (m.contains('invalid login credentials') ||
        m.contains('invalid email or password')) {
      return 'E-posta veya şifre hatalı.';
    }
    if (m.contains('email already registered') ||
        m.contains('already exists')) {
      return 'Bu e-posta zaten kayıtlı.';
    }
    if (m.contains('password should be at least')) {
      return 'Şifre en az 6 karakter olmalı.';
    }
    if (m.contains('rate limit')) {
      return 'Çok fazla deneme. Lütfen biraz bekle.';
    }
    if (m.contains('network')) {
      return 'Bağlantı hatası. İnternet bağlantını kontrol et.';
    }
    return message ?? 'Bir hata oluştu.';
  }
}
