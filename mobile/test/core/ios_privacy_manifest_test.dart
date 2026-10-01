import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Denetim F-23: iOS gizlilik manifesti var ve Xcode projesine bağlı
/// (iOS derlemesi bu ortamda yapılamaz; statik doğrulama).
void main() {
  final manifest = File('ios/Runner/PrivacyInfo.xcprivacy').readAsStringSync();
  final pbx = File('ios/Runner.xcodeproj/project.pbxproj').readAsStringSync();

  test('izleme yok, toplanan veri ve erişilen API nedenleri beyan edilmiş', () {
    expect(RegExp(r'NSPrivacyTracking</key>\s*<false/>').hasMatch(manifest),
        isTrue);
    expect(manifest, contains('NSPrivacyCollectedDataTypeEmailAddress'));
    expect(manifest, contains('NSPrivacyAccessedAPICategoryUserDefaults'));
    expect(manifest, contains('CA92.1'));
    expect('<dict>'.allMatches(manifest).length,
        '</dict>'.allMatches(manifest).length);
  });

  test('manifest Runner hedefinin Resources aşamasına eklenmiş', () {
    expect(pbx, contains('PrivacyInfo.xcprivacy in Resources'));
    expect(pbx, contains('path = PrivacyInfo.xcprivacy'));
  });
}
