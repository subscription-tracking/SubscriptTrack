import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:uuid/uuid.dart';

import '../../../core/datasources/auth_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/auth_models.dart';

// Supabase'e geçince bu sınıfın içi değişir, imzalar aynı kalır.
class AuthRepository implements AuthDataSource {
  AuthRepository({SecureStorage? storage})
      : _storage = storage ?? SecureStorage.instance;

  final SecureStorage _storage;
  static const _uuid = Uuid();

  // Mevcut oturumu döner, yoksa null
  @override
  Future<AppUser?> currentUser() async {
    final json = await _storage.readCurrentUser();
    if (json == null) return null;
    try {
      return AppUser.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<AppUser> signUp({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.isEmpty) {
      throw const AuthException('E-posta boş olamaz.');
    }
    if (password.length < 6) {
      throw const AuthException('Şifre en az 6 karakter olmalı.');
    }

    final credentials = await _loadCredentials();
    if (credentials.containsKey(normalizedEmail)) {
      throw const AuthException('Bu e-posta zaten kayıtlı.');
    }

    final user = AppUser(
      id: _uuid.v4(),
      email: normalizedEmail,
      createdAt: DateTime.now(),
    );

    credentials[normalizedEmail] = {
      'hash': _hash(password, salt: normalizedEmail),
      'userId': user.id,
      'userJson': jsonEncode(user.toJson()),
    };

    await _saveCredentials(credentials);
    await _storage.writeCurrentUser(jsonEncode(user.toJson()));
    return user;
  }

  @override
  Future<AppUser> signIn({
    required String email,
    required String password,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    final credentials = await _loadCredentials();
    final entry = credentials[normalizedEmail];

    if (entry == null ||
        entry['hash'] != _hash(password, salt: normalizedEmail)) {
      throw const AuthException('E-posta veya şifre hatalı.');
    }

    final user = AppUser.fromJson(
      jsonDecode(entry['userJson'] as String) as Map<String, dynamic>,
    );
    await _storage.writeCurrentUser(jsonEncode(user.toJson()));
    return user;
  }

  @override
  Future<void> signOut() => _storage.deleteCurrentUser();

  @override
  Future<void> deleteAccount(String email) async {
    await _storage.deleteCredentialsForEmail(email);
    await _storage.deleteCurrentUser();
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    // Local dev mode — no email is sent.
    assert(false, 'sendPasswordResetEmail is a no-op in local auth mode.');
  }

  @override
  Future<void> updatePassword(String newPassword) async {
    if (newPassword.length < 6) {
      throw const AuthException('Şifre en az 6 karakter olmalı.');
    }
    final json = await _storage.readCurrentUser();
    if (json == null) throw const AuthException('Oturum bulunamadı.');
    final user = AppUser.fromJson(jsonDecode(json) as Map<String, dynamic>);
    final credentials = await _loadCredentials();
    final entry = credentials[user.email];
    if (entry == null) throw const AuthException('Kullanıcı bulunamadı.');
    credentials[user.email] = {
      ...entry,
      'hash': _hash(newPassword, salt: user.email),
    };
    await _saveCredentials(credentials);
  }

  // ---- private helpers ----

  // SHA-256 with a fixed per-installation salt derived from the user's email.
  // This is the local-only fallback auth path (ENABLE_LOCAL_AUTH=true).
  // Production builds use SupabaseAuthRepository — this code path is never
  // reached unless explicitly enabled with --dart-define=ENABLE_LOCAL_AUTH=true.
  String _hash(String password, {required String salt}) =>
      sha256.convert(utf8.encode('$salt:$password')).toString();

  Future<Map<String, Map<String, String>>> _loadCredentials() async {
    final raw = await _storage.readCredentials();
    if (raw == null) return {};
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return decoded.map(
      (k, v) => MapEntry(k, Map<String, String>.from(v as Map)),
    );
  }

  Future<void> _saveCredentials(
    Map<String, Map<String, String>> credentials,
  ) =>
      _storage.writeCredentials(jsonEncode(credentials));
}

/// Safe default for builds without a configured production auth provider.
/// The local credential repository remains available only when explicitly
/// enabled with `--dart-define=ENABLE_LOCAL_AUTH=true`.
class UnavailableAuthRepository implements AuthDataSource {
  const UnavailableAuthRepository();

  static const _message = 'Kimlik dogrulama yapilandirilmamis.';

  @override
  Future<AppUser?> currentUser() async => null;

  @override
  Future<AppUser> signIn({required String email, required String password}) =>
      Future.error(const AuthException(_message));

  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      Future.error(const AuthException(_message));

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount(String email) async {}

  @override
  Future<void> sendPasswordResetEmail(String email) =>
      Future.error(const AuthException(_message));

  @override
  Future<void> updatePassword(String newPassword) =>
      Future.error(const AuthException(_message));
}
