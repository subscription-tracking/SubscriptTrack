import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Denetim F-15: release derlemesi yapılandırma yoksa sessizce yerel moda düşmez.
void main() {
  test('ENABLE_LOCAL_AUTH varsayılanı release\'te kapalıdır', () {
    final src = File('lib/core/config/app_environment.dart').readAsStringSync();
    expect(src, contains("bool.fromEnvironment('dart.vm.product')"));
    expect(
        src,
        contains(
            "bool.fromEnvironment('ENABLE_LOCAL_AUTH', defaultValue: !_isRelease)"));
    expect(src, isNot(contains("'ENABLE_LOCAL_AUTH', defaultValue: true")));
  });
}
