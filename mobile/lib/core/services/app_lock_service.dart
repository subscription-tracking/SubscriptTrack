import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';

import '../errors/error_messages.dart';
import '../storage/secure_storage.dart';
import 'pin_hasher.dart';

/// Device-local app lock. PIN material is never stored; only a salted
/// PBKDF2 digest ([PinHasher]) is persisted in platform secure storage.
/// Biometric unlock is opt-in.
///
/// Güvenlik denetimi (F-04): yanlış denemeler üstel bekleme ile sınırlanır
/// (sayaç güvenli depoda, uygulama yeniden başlatılsa da sıfırlanmaz) ve
/// saat geri alınırsa uygulama anında kilitlenir.
class AppLockService extends ChangeNotifier {
  AppLockService({
    SecureStorage? storage,
    LocalAuthentication? auth,
    PinHasher? hasher,
    DateTime Function()? clock,
  })  : _storage = storage ?? SecureStorage.instance,
        _auth = auth ?? LocalAuthentication(),
        _hasher = hasher ?? defaultHasher,
        _clock = clock ?? DateTime.now;

  /// Testler (`test/flutter_test_config.dart`) düşük turlu bir özetleyici atar.
  static PinHasher defaultHasher = const Pbkdf2PinHasher();

  /// Bu sayıda hatadan sonra bekleme başlar.
  static const freeAttempts = 5;
  static const maxLockout = Duration(minutes: 15);

  /// [failed] başarısız denemeden sonraki bekleme (0 = serbest).
  static Duration lockoutFor(int failed) {
    if (failed < freeAttempts) return Duration.zero;
    final seconds = 30 * (1 << (failed - freeAttempts).clamp(0, 10));
    final d = Duration(seconds: seconds);
    return d > maxLockout ? maxLockout : d;
  }

  final SecureStorage _storage;
  final LocalAuthentication _auth;
  final PinHasher _hasher;
  final DateTime Function() _clock;
  int _failedAttempts = 0;
  DateTime? _lockedUntil;
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
  int get failedAttempts => _failedAttempts;

  /// Bekleme sürüyorsa kalan süre, yoksa [Duration.zero].
  Duration get lockoutRemaining {
    final until = _lockedUntil;
    if (until == null) return Duration.zero;
    final left = until.difference(_clock().toUtc());
    if (left <= Duration.zero) return Duration.zero;
    // Saklanan değer bozulmuş/oynanmışsa sınırı aşan bekleme uygulanmaz.
    return left > maxLockout ? maxLockout : left;
  }

  bool get isLockedOut => lockoutRemaining > Duration.zero;

  /// Beklemeden önce kalan serbest deneme sayısı.
  int get attemptsLeft =>
      (freeAttempts - _failedAttempts).clamp(0, freeAttempts);

  /// S45: arka plandan dönüşte ne kadar süre kilitlenmeden bekleneceği.
  /// `Duration.zero` = her zamanki gibi anında kilitle.
  Duration get lockTimeout => _lockTimeout;

  Future<void> load() async {
    _enabled = (await _storage.readAppPinHash()) != null;
    _biometricEnabled = await _storage.readBiometricLock();
    _lockTimeout = Duration(minutes: await _storage.readLockTimeoutMinutes());
    final attempts = await _storage.readPinAttempts();
    _failedAttempts = attempts.failed;
    _lockedUntil = attempts.lockedUntil;
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
    _backgroundedAt = _clock();
  }

  /// Uygulama ön plana döndüğünde çağrılır; [handleBackground] anında
  /// kilitlemediyse geçen süreyi [lockTimeout] ile karşılaştırır.
  void handleResume() {
    final backgroundedAt = _backgroundedAt;
    _backgroundedAt = null;
    if (!_enabled || backgroundedAt == null) return;
    final now = _clock();
    // Saat geri alındıysa (now < backgroundedAt) süre doğrulanamaz: kilitle.
    if (now.isBefore(backgroundedAt) ||
        now.difference(backgroundedAt) >= _lockTimeout) {
      lock();
    }
  }

  Future<void> setPin(String pin) async {
    if (pin.length < 4 || pin.length > 8 || int.tryParse(pin) == null) {
      throw const FormatException('PIN 4-8 rakam olmalıdır');
    }
    await _storage.writeAppPinHash(await _hasher.hash(pin));
    await _resetAttempts();
    _enabled = true;
    _locked = false;
    _loaded = true;
    notifyListeners();
  }

  /// Bekleme sürerken `false` döner ve deneme sayılmaz/özet hesaplanmaz.
  Future<bool> verifyPin(String pin) async {
    if (isLockedOut) return false;
    final expected = await _storage.readAppPinHash();
    final valid = expected != null && await _hasher.verify(pin, expected);
    if (valid) {
      if (_hasher.needsUpgrade(expected)) {
        await _storage.writeAppPinHash(await _hasher.hash(pin));
      }
      await _resetAttempts();
      _locked = false;
    } else if (expected != null) {
      _failedAttempts++;
      final wait = lockoutFor(_failedAttempts);
      _lockedUntil = wait == Duration.zero ? null : _clock().toUtc().add(wait);
      await _storage.writePinAttempts(_failedAttempts, _lockedUntil);
    }
    notifyListeners();
    return valid;
  }

  Future<void> _resetAttempts() async {
    if (_failedAttempts == 0 && _lockedUntil == null) return;
    _failedAttempts = 0;
    _lockedUntil = null;
    await _storage.clearPinAttempts();
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
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );
      if (ok) {
        await _resetAttempts();
        _locked = false;
        notifyListeners();
      }
      return ok;
    } catch (e) {
      logIgnoredError('AppLockService.authenticate', e);
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
    _failedAttempts = 0;
    _lockedUntil = null;
    _loaded = true;
    notifyListeners();
  }
}
