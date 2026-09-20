// Onboarding görsel yenilemesi — özel illüstrasyonlar (float/pulse/ring
// animasyonları) ve giriş animasyonları hiçbir sayfada exception atmıyor,
// zamanlayıcılar dispose'ta düzgün temizleniyor (leaked-timer regresyonu).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:subscript_track/features/onboarding/presentation/screens/onboarding_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});
  FlutterSecureStorage.setMockInitialValues({});

  testWidgets('onboarding renders all 4 pages without exceptions',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(MaterialApp(
      home: OnboardingScreen(onDone: () {}),
    ));
    await tester.pump();
    expect(tester.takeException(), isNull, reason: 'page 1 (subscriptions)');

    await tester.tap(find.text('İleri'));
    for (var j = 0; j < 6; j++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(tester.takeException(), isNull, reason: 'page 2 (calendar)');

    await tester.tap(find.text('İleri'));
    for (var j = 0; j < 6; j++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(tester.takeException(), isNull, reason: 'page 3 (analytics)');

    await tester.tap(find.text('İleri'));
    for (var j = 0; j < 6; j++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(tester.takeException(), isNull, reason: 'page 4 (currency)');

    expect(find.text('Para birimi seç'), findsOneWidget);
    await tester.tap(find.text('ABD Doları'));
    await tester.pump();
    expect(tester.takeException(), isNull, reason: 'currency select');

    expect(find.text('Başla'), findsOneWidget,
        reason: 'last page should show "Başla" not "İleri"');
  });

  testWidgets('"Atla" completes onboarding', (tester) async {
    bool done = false;
    await tester.pumpWidget(MaterialApp(
      home: OnboardingScreen(onDone: () => done = true),
    ));
    await tester.pump();
    await tester.tap(find.text('Atla'));
    await tester.pump();
    expect(done, isTrue);
  });
}
