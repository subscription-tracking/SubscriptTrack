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
      'hash': _hash(password),
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

    if (entry == null || entry['hash'] != _hash(password)) {
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

  // Hesabı ve tüm credentials'ı tamamen siler
  @override
  Future<void> deleteAccount(String email) async {
    await _storage.deleteCredentialsForEmail(email);
    await _storage.deleteCurrentUser();
  }

  // ---- private helpers ----

  String _hash(String password) =>
      sha256.convert(utf8.encode(password)).toString();

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
