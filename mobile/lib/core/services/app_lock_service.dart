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
  bool _loaded = false;
  Duration _lockTimeout = Duration.zero;
  DateTime? _backgroundedAt;

  bool get locked => _locked;
  bool get enabled => _enabled;
  bool get biometricEnabled => _biometricEnabled;
  bool get loaded => _loaded;

  /// S45: arka plandan dönüşte ne kadar süre kilitlenmeden bekleneceği.
  /// `Duration.zero` = her zamanki gibi anında kilitle.
  Duration get lockTimeout => _lockTimeout;

  Future<void> load() async {
    _enabled = (await _storage.readAppPinHash()) != null;
    _biometricEnabled = await _storage.readBiometricLock();
    _lockTimeout = Duration(minutes: await _storage.readLockTimeoutMinutes());
    _locked = _enabled;
    _loaded = true;
    notifyListeners();
  }

  Future<void> setLockTimeout(Duration timeout) async {
    await _storage.writeLockTimeoutMinutes(timeout.inMinutes);
    _lockTimeout = timeout;
    notifyListeners();
  }

  /// Uygulama arka plana/inaktif duruma geçtiğinde çağrılır. Süre 0 ise
  /// (varsayılan) eskisi gibi anında kilitler; değilse yalnızca zamanı
  /// kaydeder — asıl karar [handleResume] içinde geçen süreye göre verilir
  /// (arka planda kod çalışmadığı için burada bir zamanlayıcı kuramayız).
  void handleBackground() {
    if (!_enabled) return;
    if (_lockTimeout == Duration.zero) {
      lock();
      return;
    }
    _backgroundedAt = DateTime.now();
  }

  /// Uygulama ön plana döndüğünde çağrılır; [handleBackground] anında
  /// kilitlemediyse geçen süreyi [lockTimeout] ile karşılaştırır.
  void handleResume() {
    final backgroundedAt = _backgroundedAt;
    _backgroundedAt = null;
    if (!_enabled || backgroundedAt == null) return;
    if (DateTime.now().difference(backgroundedAt) >= _lockTimeout) {
      lock();
    }
  }

  Future<void> setPin(String pin) async {
    if (pin.length < 4 || pin.length > 8 || int.tryParse(pin) == null) {
      throw const FormatException('PIN 4-8 rakam olmalıdır');
    }
    await _storage.writeAppPinHash(_hash(pin));
    _enabled = true;
    _locked = false;
    _loaded = true;
    notifyListeners();
  }

  Future<bool> verifyPin(String pin) async {
    final expected = await _storage.readAppPinHash();
    final valid = expected != null &&
        const _HashComparator().matches(_hash(pin), expected);
    if (valid) {
      _locked = false;
      notifyListeners();
    }
    return valid;
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    if (enabled) {
      final supported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      final enrolled = await _auth.getAvailableBiometrics();
      if (!supported || !canCheck || enrolled.isEmpty) {
        throw StateError('Bu cihazda kullanılabilir biyometri bulunamadı');
      }
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
        options: const AuthenticationOptions(
          biometricOnly: true,
          useErrorDialogs: true,
          stickyAuth: true,
        ),
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
    _lockTimeout = Duration.zero;
    _loaded = true;
    notifyListeners();
  }

  static String _hash(String pin) =>
      sha256.convert(utf8.encode(pin)).toString();
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
