import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/app/theme/app_theme.dart';

/// Denetim F-19: yazı tipi pakete gömülü, çalışma zamanında indirilmez.
void main() {
  test('tema gömülü Hanken Grotesk ailesini kullanır', () {
    final t = AppTheme.dark.textTheme;
    expect(t.bodyMedium?.fontFamily, kAppFontFamily);
    expect(t.titleLarge?.fontFamily, kAppFontFamily);
  });

  test('font dosyası ve lisans pakette, pubspec\'te tanımlı', () {
    expect(File('assets/fonts/HankenGrotesk.ttf').existsSync(), isTrue);
    expect(File('assets/fonts/OFL.txt').readAsStringSync(),
        contains('SIL OPEN FONT LICENSE'));
    final pubspec = File('pubspec.yaml').readAsStringSync();
    expect(pubspec, contains('family: HankenGrotesk'));
    expect(pubspec, isNot(contains('google_fonts')));
  });

  test('kodda google_fonts / fonts.gstatic.com kullanımı yok', () {
    for (final f in Directory('lib')
        .listSync(recursive: true)
        .whereType<File>()
        .where((f) => f.path.endsWith('.dart'))) {
      final src = f.readAsStringSync();
      expect(src.contains('google_fonts'), isFalse, reason: f.path);
      expect(src.contains('fonts.gstatic.com'), isFalse, reason: f.path);
    }
  });
}
