import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../../../core/datasources/auth_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../domain/auth_models.dart';

/// Supabase Auth tabanlı repository.
/// EnvironmentConfig.isSupabaseConfigured == true olduğunda AuthController
/// bu sınıfı kullanır. Token yenileme, session kalıcılığı ve güvenli
/// depolama supabase_flutter tarafından otomatik yönetilir.
class SupabaseAuthRepository
    implements
        AuthDataSource,
        SocialAuthDataSource,
        EmailUpdateDataSource,
        AuthStateDataSource,
        EmailConfirmationDataSource {
  /// [client] verilmezse `Supabase.instance` kullanılır (testlerde enjekte edilir).
  SupabaseAuthRepository({sb.SupabaseClient? client}) : _injected = client;

  final sb.SupabaseClient? _injected;

  sb.SupabaseClient get _client => _injected ?? sb.Supabase.instance.client;

  @override
  bool lastSignUpRequiresEmailConfirmation = false;

  @override
  Stream<AuthStateChange> get authStateChanges => _client.auth.onAuthStateChange
      .map((state) {
        final event = switch (state.event) {
          sb.AuthChangeEvent.passwordRecovery =>
            AuthStateEvent.passwordRecovery,
          sb.AuthChangeEvent.userUpdated => AuthStateEvent.userUpdated,
          sb.AuthChangeEvent.signedIn => AuthStateEvent.signedIn,
          sb.AuthChangeEvent.tokenRefreshed => AuthStateEvent.tokenRefreshed,
          sb.AuthChangeEvent.signedOut => AuthStateEvent.signedOut,
          _ => null,
        };
        final sessionUser = state.session?.user;
        return (event, sessionUser == null ? null : _toAppUser(sessionUser));
      })
      .where((e) => e.$1 != null)
      .map((e) => AuthStateChange(e.$1!, e.$2));

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
      lastSignUpRequiresEmailConfirmation = response.session == null;
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
  Future<bool> signInWithProvider(String provider) async {
    final oauth = switch (provider.toLowerCase()) {
      'google' => sb.OAuthProvider.google,
      'apple' => sb.OAuthProvider.apple,
      _ => throw const AuthException('Desteklenmeyen giriş sağlayıcısı.'),
    };
    try {
      return await _client.auth
          .signInWithOAuth(oauth, redirectTo: 'subscripttrack://auth-callback');
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    }
  }

  @override
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Hesabı kalıcı olarak siler.
  ///
  /// Kullanıcı silme admin yetkisi gerektirdiğinden sunucu tarafında
  /// çalışan bir Edge Function üzerinden yapılır.
  /// Edge Function: backend/supabase/functions/delete-account/index.ts
  @override
  Future<void> deleteAccount(String email) async {
    try {
      await _client.functions.invoke('delete-account');
    } on sb.FunctionException catch (e) {
      throw AuthException('Hesap silinemedi: ${e.details}');
    } catch (e) {
      throw AuthException(e.toString());
    }
    await _client.auth.signOut();
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      // Native builds return through the app deep link; the web build must
      // return to the currently deployed Pages origin instead of Supabase's
      // default Site URL (which may still be localhost).
      final redirectTo = kIsWeb
          ? Uri.base.origin + Uri.base.path
          : 'subscripttrack://auth-callback';
      await _client.auth.resetPasswordForEmail(email, redirectTo: redirectTo);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    }
  }

  @override
  Future<void> updatePassword(String newPassword) async {
    try {
      await _client.auth.updateUser(
        sb.UserAttributes(password: newPassword),
      );
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  @override
  Future<AppUser> updateDisplayName(String name) async {
    try {
      final response = await _client.auth.updateUser(
        sb.UserAttributes(data: {'display_name': name}),
      );
      final user = response.user;
      if (user == null) throw const AuthException('Ad güncellenemedi.');
      return _toAppUser(user);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  @override
  Future<AppUser> updateEmail(String email) async {
    final normalized = email.trim().toLowerCase();
    if (normalized.isEmpty || !normalized.contains('@')) {
      throw const AuthException('Geçerli bir e-posta adresi gir.');
    }
    try {
      final response = await _client.auth.updateUser(
        sb.UserAttributes(email: normalized),
      );
      final user = response.user;
      if (user == null) throw const AuthException('E-posta güncellenemedi.');
      return _toAppUser(user);
    } on sb.AuthException catch (e) {
      throw AuthException(_localizeError(e.message));
    } catch (e) {
      throw AuthException(e.toString());
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────

  AppUser _toAppUser(sb.User user) => AppUser(
        id: user.id,
        email: user.email ?? '',
        displayName: user.userMetadata?['display_name'] as String?,
        createdAt: DateTime.parse(user.createdAt),
      );

  String _localizeError(String? message) {
    final m = message?.toLowerCase() ?? '';
    for (final (patterns, text) in _errorMessages) {
      if (patterns.any(m.contains)) return text;
    }
    return message ?? 'Bir hata oluştu.';
  }

  /// Sunucu hata metninde geçen ifade -> kullanıcıya gösterilen mesaj.
  static const _errorMessages = <(List<String>, String)>[
    (
      ['invalid login credentials', 'invalid email or password'],
      'E-posta veya şifre hatalı.'
    ),
    (
      ['already registered', 'already been registered', 'already exists'],
      'Bu e-posta zaten kayıtlı.'
    ),
    (['password should be at least'], 'Şifre en az 6 karakter olmalı.'),
    (['rate limit'], 'Çok fazla deneme. Lütfen biraz bekle.'),
    (['network'], 'Bağlantı hatası. İnternet bağlantını kontrol et.'),
  ];
}
