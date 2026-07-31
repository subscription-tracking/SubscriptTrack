import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/config/app_environment.dart';
import '../../../core/datasources/auth_data_source.dart';
import '../../../core/storage/local_storage.dart';
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
                : AuthRepository());

  final AuthDataSource _repo;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  String? _error;
  bool _loading = false;
  bool _initialized = false;
  bool _onboardingNeeded = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get error => _error;
  bool get loading => _loading;
  bool get initialized => _initialized;
  bool get onboardingNeeded => _onboardingNeeded;

  Future<bool> init() async {
    final results = await Future.wait<dynamic>([
      _repo.currentUser(),
      _checkOnboarding(),
    ]);
    _user = results[0] as AppUser?;
    _onboardingNeeded = results[1] as bool;
    _status = _user != null
        ? AuthStatus.authenticated
        : AuthStatus.unauthenticated;
    _initialized = true;
    notifyListeners();
    return _user != null;
  }

  void onboardingDone() {
    _onboardingNeeded = false;
    notifyListeners();
  }

  Future<bool> signUp(String email, String password) async {
    _setLoading(true);
    try {
      _user = await _repo.signUp(email: email, password: password);
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

  Future<void> signOut() async {
    await _repo.signOut();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> deleteAccount(LocalStorage localStorage) async {
    if (_user == null) return;
    await localStorage.deleteSubscriptions(_user!.id);
    await _repo.deleteAccount(_user!.email);
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<bool> sendPasswordResetEmail(String email) async {
    _setLoading(true);
    try {
      final repo = _repo;
      if (repo is SupabaseAuthRepository) {
        await repo.sendPasswordResetEmail(email);
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
