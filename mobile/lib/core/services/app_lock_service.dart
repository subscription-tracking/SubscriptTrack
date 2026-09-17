import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';

import '../storage/secure_storage.dart';

/// Device-local app lock. PIN material is never stored; only SHA-256(PIN)
/// is persisted in platform secure storage. Biometric unlock is opt-in.
class AppLockService extends ChangeNotifier {
  static final instance = AppLockService();
  AppLockService({SecureStorage? storage, LocalAuthentication? auth})
      : _storage = storage ?? SecureStorage.instance,
        _auth = auth ?? LocalAuthentication();

  final SecureStorage _storage;
  final LocalAuthentication _auth;
  bool _locked = false;
  bool _enabled = false;
  bool _biometricEnabled = false;

  bool get locked => _locked;
  bool get enabled => _enabled;
  bool get biometricEnabled => _biometricEnabled;

  Future<void> load() async {
    _enabled = (await _storage.readAppPinHash()) != null;
    _biometricEnabled = await _storage.readBiometricLock();
    _locked = false;
    notifyListeners();
  }

  Future<void> setPin(String pin) async {
    if (pin.length < 4 || pin.length > 8 || int.tryParse(pin) == null) {
      throw const FormatException('PIN 4-8 rakam olmalıdır');
    }
    await _storage.writeAppPinHash(_hash(pin));
    _enabled = true;
    _locked = false;
    notifyListeners();
  }

  Future<bool> verifyPin(String pin) async {
    final expected = await _storage.readAppPinHash();
    final valid = expected != null && const _HashComparator().matches(_hash(pin), expected);
    if (valid) {
      _locked = false;
      notifyListeners();
    }
    return valid;
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    if (enabled && !(await _auth.isDeviceSupported())) {
      throw StateError('Bu cihaz biyometrik kilidi desteklemiyor');
    }
    await _storage.writeBiometricLock(enabled);
    _biometricEnabled = enabled;
    notifyListeners();
  }

  Future<bool> unlockWithBiometric() async {
    if (!_biometricEnabled) return false;
    try {
      final ok = await _auth.authenticate(
        localizedReason: 'SubscriptTrack verilerinizi açmak için doğrulayın',
        options: const AuthenticationOptions(biometricOnly: true),
      );
      if (ok) {
        _locked = false;
        notifyListeners();
      }
      return ok;
    } catch (_) {
      return false;
    }
  }

  void lock() {
    if (!_enabled) return;
    _locked = true;
    notifyListeners();
  }

  Future<void> disable() async {
    await _storage.deleteAppLock();
    _enabled = false;
    _biometricEnabled = false;
    _locked = false;
    notifyListeners();
  }

  static String _hash(String pin) => sha256.convert(utf8.encode(pin)).toString();
}

class _HashComparator {
  const _HashComparator();
  bool matches(String actual, String expected) {
    final a = Uint8List.fromList(utf8.encode(actual));
    final b = Uint8List.fromList(utf8.encode(expected));
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff == 0;
  }
}
