import 'package:flutter_test/flutter_test.dart';

import 'package:subscript_track/features/auth/domain/password_policy.dart';

void main() {
  group('PasswordPolicy (güvenlik denetimi F-03)', () {
    test('en az uzunluk 10', () {
      expect(PasswordPolicy.minLength, 10);
      expect(PasswordPolicy.isValid('123456789'), isFalse);
      expect(PasswordPolicy.isValid('1234567890'), isTrue);
      expect(PasswordPolicy.isValid(null), isFalse);
    });

    test('validateNew: boş, kısa ve geçerli', () {
      expect(PasswordPolicy.validateNew(null), 'Şifre gerekli.');
      expect(PasswordPolicy.validateNew(''), 'Şifre gerekli.');
      expect(
          PasswordPolicy.validateNew('kisa'), PasswordPolicy.tooShortMessage);
      expect(PasswordPolicy.validateNew('yeterince-uzun'), isNull);
    });

    test('mesajlar uzunluğu yansıtır', () {
      expect(PasswordPolicy.tooShortMessage, 'Şifre en az 10 karakter olmalı.');
      expect(PasswordPolicy.requirement, 'En az 10 karakter');
    });
  });
}
