import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

/// PIN özetleme ve doğrulama (uygulama kilidi).
///
/// Güvenlik denetimi (F-04): eski biçim salt'sız tek tur SHA-256 idi; 4–8
/// haneli bir PIN için özet saniyeler içinde tersine çevrilebilir. Yeni biçim
/// `v2:<tur>:<salt>:<özet>` (PBKDF2-HMAC-SHA256, rastgele salt). Eski özetler
/// doğrulanır ve başarılı girişte otomatik yükseltilir.
abstract class PinHasher {
  const PinHasher();

  static const _prefix = 'v2';

  /// `v2:<tur>:<salt>:<özet>` biçiminde yeni özet üretir.
  Future<String> hash(String pin);

  /// [stored] yeni veya eski biçimde olabilir; sabit zamanlı karşılaştırır.
  Future<bool> verify(String pin, String stored);

  /// Eski (salt'sız SHA-256) ya da daha az turlu özetler yükseltilmelidir.
  bool needsUpgrade(String stored);

  static bool isLegacy(String stored) =>
      RegExp(r'^[0-9a-f]{64}$').hasMatch(stored);

  static bool constantTimeEquals(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff == 0;
  }

  static String _b64(List<int> bytes) => base64Url.encode(bytes);
}

/// PBKDF2-HMAC-SHA256 (RFC 8018). Ağır döngü, mümkün olduğunda arka plan
/// isolate'inde çalışır (web'de ve [useIsolate] `false` iken aynı iş parçacığı).
class Pbkdf2PinHasher extends PinHasher {
  const Pbkdf2PinHasher(
      {this.iterations = defaultIterations, this.useIsolate = true});

  /// Telefonda yaklaşık yüzlerce ms; saklanan biçim tur sayısını taşıdığı için
  /// ileride artırılabilir (eski özetler yine doğrulanır, sonra yükseltilir).
  static const defaultIterations = 30000;

  final int iterations;
  final bool useIsolate;

  @override
  Future<String> hash(String pin) async {
    final salt = _randomSalt();
    final derived = await _derive(pin, salt, iterations);
    return '${PinHasher._prefix}:$iterations:${PinHasher._b64(salt)}:${PinHasher._b64(derived)}';
  }

  @override
  Future<bool> verify(String pin, String stored) async {
    if (PinHasher.isLegacy(stored)) {
      final legacy = sha256.convert(utf8.encode(pin)).toString();
      return PinHasher.constantTimeEquals(
          utf8.encode(legacy), utf8.encode(stored));
    }
    final parts = stored.split(':');
    if (parts.length != 4 || parts[0] != PinHasher._prefix) return false;
    final rounds = int.tryParse(parts[1]);
    if (rounds == null || rounds < 1 || rounds > 5000000) return false;
    final List<int> salt;
    final List<int> expected;
    try {
      salt = base64Url.decode(parts[2]);
      expected = base64Url.decode(parts[3]);
    } on FormatException {
      return false;
    }
    final derived = await _derive(pin, salt, rounds, expected.length);
    return PinHasher.constantTimeEquals(derived, expected);
  }

  @override
  bool needsUpgrade(String stored) {
    if (PinHasher.isLegacy(stored)) return true;
    final parts = stored.split(':');
    if (parts.length != 4 || parts[0] != PinHasher._prefix) return true;
    final rounds = int.tryParse(parts[1]) ?? 0;
    return rounds < iterations;
  }

  Future<Uint8List> _derive(String pin, List<int> salt, int rounds,
      [int length = 32]) {
    final args = _Pbkdf2Args(utf8.encode(pin), salt, rounds, length);
    if (!useIsolate || kIsWeb) return Future.value(_pbkdf2(args));
    return compute(_pbkdf2, args);
  }

  static Uint8List _randomSalt() {
    final random = Random.secure();
    return Uint8List.fromList(
        List<int>.generate(16, (_) => random.nextInt(256)));
  }
}

/// Testlerde isolate/fake-async sorunlarını önlemek için senkron, düşük turlu
/// özetleyici (`test/flutter_test_config.dart` bunu varsayılan yapar).
class InlinePinHasher extends Pbkdf2PinHasher {
  const InlinePinHasher({super.iterations = 1000}) : super(useIsolate: false);
}

class _Pbkdf2Args {
  const _Pbkdf2Args(this.password, this.salt, this.iterations, this.length);
  final List<int> password;
  final List<int> salt;
  final int iterations;
  final int length;
}

/// PBKDF2 (RFC 8018, bölüm 5.2) — HMAC-SHA256, çıktı uzunluğu [length] bayt.
Uint8List _pbkdf2(_Pbkdf2Args a) =>
    pbkdf2HmacSha256(a.password, a.salt, a.iterations, a.length);

/// Test vektörleriyle doğrulanır (`test/core/pin_hasher_test.dart`).
@visibleForTesting
Uint8List pbkdf2HmacSha256(
    List<int> password, List<int> salt, int iterations, int length) {
  const hLen = 32;
  final blocks = (length + hLen - 1) ~/ hLen;
  final hmac = Hmac(sha256, password);
  final out = BytesBuilder(copy: false);
  for (var block = 1; block <= blocks; block++) {
    final index = ByteData(4)..setUint32(0, block);
    var u = Uint8List.fromList(
        hmac.convert([...salt, ...index.buffer.asUint8List()]).bytes);
    final t = Uint8List.fromList(u);
    for (var i = 1; i < iterations; i++) {
      u = Uint8List.fromList(hmac.convert(u).bytes);
      for (var j = 0; j < hLen; j++) {
        t[j] ^= u[j];
      }
    }
    out.add(t);
  }
  return Uint8List.sublistView(out.toBytes(), 0, length);
}
