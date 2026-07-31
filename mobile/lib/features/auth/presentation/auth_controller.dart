import 'package:flutter/foundation.dart';

import '../data/auth_repository.dart';
import '../domain/auth_models.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  AuthController({AuthRepository? repository})
      : _repo = repository ?? AuthRepository();

  final AuthRepository _repo;

  AuthStatus _status = AuthStatus.unknown;
  AppUser? _user;
  String? _error;
  bool _loading = false;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get error => _error;
  bool get loading => _loading;

  Future<bool> init() async {
    _user = await _repo.currentUser();
    _status = _user != null
        ? AuthStatus.authenticated
        : AuthStatus.unauthenticated;
    notifyListeners();
    return _user != null;
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

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
