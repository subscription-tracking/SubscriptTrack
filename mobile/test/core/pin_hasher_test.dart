import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/core/services/pin_hasher.dart';

String _hex(List<int> bytes) =>
    bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

void main() {
  group('PBKDF2-HMAC-SHA256 (yaygın test vektörleri)', () {
    final pw = utf8.encode('password');
    final salt = utf8.encode('salt');

    test('c=1', () {
      expect(_hex(pbkdf2HmacSha256(pw, salt, 1, 32)),
          '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
    });
    test('c=2', () {
      expect(_hex(pbkdf2HmacSha256(pw, salt, 2, 32)),
          'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
    });
    test('c=4096', () {
      expect(_hex(pbkdf2HmacSha256(pw, salt, 4096, 32)),
          'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
    });
  });

  group('PinHasher', () {
    const hasher = InlinePinHasher(iterations: 500);

    test('yeni biçim v2 ve salt rastgele (aynı PIN farklı özet)', () async {
      final a = await hasher.hash('1234');
      final b = await hasher.hash('1234');
      expect(a.startsWith('v2:500:'), isTrue);
      expect(a.split(':').length, 4);
      expect(a, isNot(b), reason: 'her özet kendi rastgele salt\'ını taşır');
    });

    test('doğru PIN doğrulanır, yanlış PIN reddedilir', () async {
      final stored = await hasher.hash('4567');
      expect(await hasher.verify('4567', stored), isTrue);
      expect(await hasher.verify('4568', stored), isFalse);
      expect(await hasher.verify('', stored), isFalse);
    });

    test('bozuk veya tanınmayan saklı değer reddedilir', () async {
      for (final bad in ['', 'v2:abc', 'v2:0:AA:AA', 'v3:500:AA:AA', 'xyz']) {
        expect(await hasher.verify('1234', bad), isFalse, reason: bad);
      }
    });

    test('eski salt\'sız SHA-256 özeti doğrulanır ve yükseltilmeli', () async {
      final legacy = sha256.convert(utf8.encode('1234')).toString();
      expect(await hasher.verify('1234', legacy), isTrue);
      expect(await hasher.verify('9999', legacy), isFalse);
      expect(hasher.needsUpgrade(legacy), isTrue);
    });

    test('paylaşılan Flutter–Expo legacy SHA-256 ve PBKDF2 v2 vektörleri',
        () async {
      final fixture = jsonDecode(
        File('../testdata/flutter_expo_domain_goldens.json').readAsStringSync(),
      ) as Map<String, dynamic>;
      final golden = fixture['pinCompatibility'] as Map<String, dynamic>;
      const crossRuntimeHasher = Pbkdf2PinHasher(iterations: 2, useIsolate: false);
      final pin = golden['pin'] as String;
      final legacy = golden['legacySha256'] as String;
      final pbkdf2 = golden['pbkdf2V2'] as String;

      expect(await crossRuntimeHasher.verify(pin, legacy), isTrue);
      expect(await crossRuntimeHasher.verify('9999', legacy), isFalse);
      expect(await crossRuntimeHasher.verify(pin, pbkdf2), isTrue);
      expect(await crossRuntimeHasher.verify('9999', pbkdf2), isFalse);
      expect(crossRuntimeHasher.needsUpgrade(legacy), isTrue);
    });

    test('daha az turlu özet yükseltilmeli, eşit/fazla turlu yükseltilmez',
        () async {
      final weaker = await const InlinePinHasher(iterations: 100).hash('1234');
      expect(hasher.needsUpgrade(weaker), isTrue);
      final current = await hasher.hash('1234');
      expect(hasher.needsUpgrade(current), isFalse);
    });

    test('isolate ile üretilen özet inline doğrulamayla uyumludur', () async {
      const isolated = Pbkdf2PinHasher(iterations: 500, useIsolate: true);
      final stored = await isolated.hash('2468');
      expect(await hasher.verify('2468', stored), isTrue);
    });
  });

  test(
      'constantTimeEquals farklı uzunlukları (ortak önek olsa bile) eşit saymaz',
      () {
    expect(PinHasher.constantTimeEquals([1, 2], [1, 2, 3]), isFalse);
    expect(PinHasher.constantTimeEquals([1, 2, 3], [1, 2]), isFalse);
    expect(PinHasher.constantTimeEquals([1, 2, 3], [1, 2, 3]), isTrue);
    expect(PinHasher.constantTimeEquals([1, 2, 3], [1, 2, 4]), isFalse);
  });
}
