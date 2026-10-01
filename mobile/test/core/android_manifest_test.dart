import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Denetim F-09: Android yedekleme kapalı; oturum/PIN özeti cihazdan çıkmaz.
void main() {
  final manifest =
      File('android/app/src/main/AndroidManifest.xml').readAsStringSync();

  test('allowBackup kapalı ve yedek kuralları tanımlı', () {
    expect(manifest, contains('android:allowBackup="false"'));
    expect(manifest,
        contains('android:dataExtractionRules="@xml/data_extraction_rules"'));
    expect(manifest, contains('android:fullBackupContent="@xml/backup_rules"'));
    for (final f in ['data_extraction_rules.xml', 'backup_rules.xml']) {
      expect(File('android/app/src/main/res/xml/$f').existsSync(), isTrue);
    }
  });

  test('yedek kuralları tüm alanları dışlar', () {
    final rules = File('android/app/src/main/res/xml/data_extraction_rules.xml')
        .readAsStringSync();
    expect(rules, isNot(contains('<include')));
    for (final d in ['sharedpref', 'file', 'database']) {
      expect(rules, contains('domain="$d"'));
    }
  });

  test('dışa açık bileşenler yalnızca ana etkinlik', () {
    final exported = RegExp(r'android:exported="true"').allMatches(manifest);
    expect(exported.length, 1);
  });
}
