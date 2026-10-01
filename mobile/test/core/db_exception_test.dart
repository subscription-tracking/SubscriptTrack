import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/errors/error_messages.dart';

void main() {
  test('23514 (CHECK ihlali) anlaşılır doğrulama hatasına çevrilir', () {
    final e = dbException('23514',
        'new row for relation "subscriptions" violates check constraint "subscriptions_name_length"');
    expect(e, isA<ValidationException>());
    expect(e.message, isNot(contains('subscriptions_name_length')));
  });

  test('diğer kodlar ağ hatası olarak kalır', () {
    expect(dbException('500', 'boom'), isA<NetworkException>());
    expect(dbException(null, 'boom').message, 'boom');
  });
}
