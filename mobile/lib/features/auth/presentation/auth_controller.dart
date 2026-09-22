import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/auth_data_source.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/local_storage.dart';
import '../../settings/presentation/settings_controller.dart';
import '../data/auth_repository.dart';
import '../data/supabase_auth_repository.dart';
import '../domain/auth_models.dart';

export '../domain/auth_models.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  AuthController({AuthDataSource? repository})
      : _repo = repository ??
            (EnvironmentConfig.isSupabaseConfigured
                ? SupabaseAuthRepository()
                : EnvironmentConfig.enableLocalAuth
                    ? AuthRepository()
                    : const UnavailableAuthRepository());

  final AuthDataSource _repo;
  StreamSubscription<sb.AuthState>? _authSubscription;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  String? _error;
  bool _loading = false;
  bool _initialized = false;
  bool _onboardingNeeded = false;
  bool _passwordRecoveryMode = false;
  bool _emailVerificationRequired = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get error => _error;
  bool get loading => _loading;
  bool get initialized => _initialized;
  bool get onboardingNeeded => _onboardingNeeded;
  bool get passwordRecoveryMode => _passwordRecoveryMode;
  bool get emailVerificationRequired => _emailVerificationRequired;

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  Future<bool> init() async {
    if (EnvironmentConfig.isSupabaseConfigured) {
      _authSubscription =
          sb.Supabase.instance.client.auth.onAuthStateChange.listen((data) {
        switch (data.event) {
          case sb.AuthChangeEvent.passwordRecovery:
            _passwordRecoveryMode = true;
            notifyListeners();
          case sb.AuthChangeEvent.userUpdated:
            _passwordRecoveryMode = false;
            _user = data.session?.user == null
                ? _user
                : AppUser(
                    id: data.session!.user.id,
                    email: data.session!.user.email ?? '',
                    displayName: data
                        .session!.user.userMetadata?['display_name'] as String?,
                    createdAt: DateTime.parse(data.session!.user.createdAt),
                  );
            notifyListeners();
          case sb.AuthChangeEvent.signedIn:
          case sb.AuthChangeEvent.tokenRefreshed:
            if (data.session?.user != null) {
              _user = AppUser(
                id: data.session!.user.id,
                email: data.session!.user.email ?? '',
                displayName:
                    data.session!.user.userMetadata?['display_name'] as String?,
                createdAt: DateTime.parse(data.session!.user.createdAt),
              );
              _status = AuthStatus.authenticated;
              _initialized = true;
              notifyListeners();
            }
          case sb.AuthChangeEvent.signedOut:
            _user = null;
            _status = AuthStatus.unauthenticated;
            _passwordRecoveryMode = false;
            _initialized = true;
            notifyListeners();
          default:
            break;
        }
      });
    }

    final results = await Future.wait<dynamic>([
      _repo.currentUser(),
      _checkOnboarding(),
    ]);
    // Always apply onboarding state.
    _onboardingNeeded = results[1] as bool;

    // The Supabase stream fires synchronously on subscription for existing
    // sessions and sets _initialized = true. Only overwrite auth state when
    // the stream hasn't already resolved it — otherwise we race-overwrite a
    // valid authenticated state with a stale Future.wait result.
    if (!_initialized) {
      _user = results[0] as AppUser?;
      _status =
          _user != null ? AuthStatus.authenticated : AuthStatus.unauthenticated;
      _initialized = true;
    }
    notifyListeners();
    return _user != null;
  }

  void onboardingDone() {
    _onboardingNeeded = false;
    notifyListeners();
  }

  /// Kullanıcının isteğiyle (Ayarlar'dan) tanıtım turunu yeniden gösterir.
  void restartOnboarding() {
    _onboardingNeeded = true;
    notifyListeners();
  }

  Future<bool> signUp(String email, String password) async {
    _setLoading(true);
    try {
      _user = await _repo.signUp(email: email, password: password);
      final requiresVerification = _repo is SupabaseAuthRepository &&
          _repo.lastSignUpRequiresEmailConfirmation;
      _emailVerificationRequired = requiresVerification;
      _status = requiresVerification
          ? AuthStatus.unauthenticated
          : AuthStatus.authenticated;
      if (requiresVerification) {
        _user = null;
        _error = 'Kayıt tamamlandı. Devam etmek için e-postanı doğrula.';
        return false;
      }
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> signIn(String email, String password) async {
    _setLoading(true);
    try {
      _user = await _repo.signIn(email: email, password: password);
      _status = AuthStatus.authenticated;
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> signInWithProvider(String provider) async {
    final social =
        _repo is SocialAuthDataSource ? _repo as SocialAuthDataSource : null;
    if (social == null) {
      _error = 'Sosyal giriş yalnızca Supabase modunda kullanılabilir.';
      notifyListeners();
      return false;
    }
    _setLoading(true);
    try {
      final started = await social.signInWithProvider(provider);
      _error = null;
      return started;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    await _repo.signOut();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> deleteAccount(LocalStorage localStorage) async {
    if (_user == null) return;
    final userId = _user!.id;
    final email = _user!.email;
    await _repo.deleteAccount(email);
    // Only clear local data after the server confirms permanent deletion.
    await Future.wait([
      localStorage.deleteSubscriptions(userId),
      localStorage.deleteFinancialEvents(userId),
      SettingsController.instance.clearAccountPaymentMethods(),
      _clearNotificationReadState(),
    ]);
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  static Future<void> _clearNotificationReadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('notif_read_ids');
    } catch (_) {}
  }

  Future<bool> updatePassword(String newPassword) async {
    _setLoading(true);
    try {
      await _repo.updatePassword(newPassword);
      _passwordRecoveryMode = false;
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Oturum içinden şifre değiştirir. Mevcut şifreyi [signIn] ile doğrulayıp
  /// (delete_account akışındaki aynı re-auth deseni) ardından [updatePassword]
  /// çağırır — e-posta bağlantısı akışına çıkmadan çalışır.
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (_user == null) {
      _error = 'Oturum bulunamadı.';
      notifyListeners();
      return false;
    }
    final verified = await signIn(_user!.email, currentPassword);
    if (!verified) {
      _error = error ?? 'Mevcut şifre doğrulanamadı.';
      notifyListeners();
      return false;
    }
    return updatePassword(newPassword);
  }

  Future<bool> updateDisplayName(String name) async {
    _setLoading(true);
    try {
      _user = await _repo.updateDisplayName(name.trim());
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateEmail(String email) async {
    try {
      if (_repo is! EmailUpdateDataSource) {
        throw const AuthException('Bu giriş modunda e-posta değiştirilemez.');
      }
      _user = await (_repo as EmailUpdateDataSource).updateEmail(email);
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendPasswordResetEmail(String email) async {
    _setLoading(true);
    try {
      await _repo.sendPasswordResetEmail(email);
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  static Future<bool> _checkOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('onboarding_done') != true;
  }
}
