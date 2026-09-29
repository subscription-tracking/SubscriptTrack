import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/errors/error_messages.dart';

void main() {
  test('AppException mesajı aynen döner', () {
    expect(
        userMessageFor(const NetworkException('Bağlantı yok')), 'Bağlantı yok');
    expect(userMessageFor(const AuthException('Şifre hatalı')), 'Şifre hatalı');
  });

  test('bilinmeyen istisnalar teknik ayrıntı sızdırmaz', () {
    final message = userMessageFor(const FormatException('bad json at 12'));
    expect(message, isNot(contains('bad json')));
    expect(message, contains('Beklenmeyen'));
  });
}
