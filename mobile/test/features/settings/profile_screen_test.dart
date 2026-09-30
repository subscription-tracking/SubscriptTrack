import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/settings/presentation/screens/profile_screen.dart';

import '../../support/fake_auth.dart';

Future<void> _pump(WidgetTester tester, Widget screen) async {
  await tester.binding.setSurfaceSize(const Size(400, 1800));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(MaterialApp(home: screen));
  await tester.pump();
}

Finder _field(int index) => find.byType(TextField).at(index);

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  testWidgets('e-posta, üyelik tarihi ve varsayılan isim gösterilir',
      (tester) async {
    final s = await signedInAuth(email: 'kisi@example.com');
    await _pump(tester, ProfileScreen(auth: s.auth));

    expect(find.text('kisi@example.com'), findsWidgets);
    expect(find.text('Üye olma: 15 Ocak 2026'), findsOneWidget);
    // Görünen ad yoksa e-postanın yerel kısmı kullanılır.
    expect(find.widgetWithText(TextField, 'kisi'), findsOneWidget);
    expect(find.text('K'), findsOneWidget);
  });

  testWidgets('kullanıcı yoksa boş görünüm', (tester) async {
    final s = await signedInAuth();
    await s.auth.signOut();
    await _pump(tester, ProfileScreen(auth: s.auth));
    expect(find.text('Profil'), findsNothing);
  });

  testWidgets('isim değişmeden Kaydet pasif; değişince kaydeder',
      (tester) async {
    final s = await signedInAuth();
    await _pump(tester, ProfileScreen(auth: s.auth));

    FilledButton save() => tester
        .widget<FilledButton>(find.widgetWithText(FilledButton, 'Kaydet'));
    expect(save().onPressed, isNull);

    await tester.enterText(_field(0), 'Ayşe');
    await tester.pump();
    expect(save().onPressed, isNotNull);

    await tester.tap(find.widgetWithText(FilledButton, 'Kaydet'));
    await tester.pumpAndSettle();

    expect(find.text('İsim güncellendi.'), findsOneWidget);
    expect(s.auth.user?.displayName, 'Ayşe');
  });

  testWidgets('isim güncellenemezse hata mesajı gösterilir', (tester) async {
    final s = await signedInAuth();
    await _pump(tester, ProfileScreen(auth: s.auth));
    s.source.failWith = 'Sunucu reddetti.';

    await tester.enterText(_field(0), 'Ayşe');
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'Kaydet'));
    await tester.pumpAndSettle();

    expect(find.text('Sunucu reddetti.'), findsOneWidget);
    expect(s.auth.error, isNull,
        reason: 'hata gösterildikten sonra temizlenir');
  });

  testWidgets('e-posta değiştirilir', (tester) async {
    final s = await signedInAuth();
    await _pump(tester, ProfileScreen(auth: s.auth));

    FilledButton update() => tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'E-postayı güncelle'));
    expect(update().onPressed, isNull);

    await tester.enterText(_field(1), 'yeni@example.com');
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'E-postayı güncelle'));
    await tester.pumpAndSettle();

    expect(find.textContaining('E-posta güncellendi'), findsOneWidget);
    expect(s.auth.user?.email, 'yeni@example.com');
  });

  testWidgets('e-posta değişimi başarısızsa hata gösterilir', (tester) async {
    final s = await signedInAuth();
    await _pump(tester, ProfileScreen(auth: s.auth));
    s.source.failWith = 'Bu e-posta kullanımda.';

    await tester.enterText(_field(1), 'yeni@example.com');
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'E-postayı güncelle'));
    await tester.pumpAndSettle();

    expect(find.text('Bu e-posta kullanımda.'), findsOneWidget);
  });

  group('şifre değiştirme', () {
    testWidgets('alanlar geçerli olana kadar buton pasif', (tester) async {
      final s = await signedInAuth();
      await _pump(tester, ProfileScreen(auth: s.auth));

      FilledButton button() => tester.widget<FilledButton>(
          find.widgetWithText(FilledButton, 'Şifreyi güncelle'));
      expect(button().onPressed, isNull);

      await tester.enterText(_field(2), 'sifre123');
      await tester.enterText(_field(3), 'kisa');
      await tester.enterText(_field(4), 'kisa');
      await tester.pump();
      expect(button().onPressed, isNull, reason: '6 karakterden kısa');

      await tester.enterText(_field(3), 'yenisifre');
      await tester.enterText(_field(4), 'baskasifre');
      await tester.pump();
      expect(button().onPressed, isNull, reason: 'tekrar eşleşmiyor');

      await tester.enterText(_field(4), 'yenisifre');
      await tester.pump();
      expect(button().onPressed, isNotNull);
    });

    testWidgets('doğru mevcut şifreyle güncellenir ve alanlar temizlenir',
        (tester) async {
      final s = await signedInAuth();
      await _pump(tester, ProfileScreen(auth: s.auth));

      await tester.enterText(_field(2), 'sifre123');
      await tester.enterText(_field(3), 'yenisifre');
      await tester.enterText(_field(4), 'yenisifre');
      await tester.pump();
      await tester.tap(find.widgetWithText(FilledButton, 'Şifreyi güncelle'));
      await tester.pumpAndSettle();

      expect(find.text('Şifren başarıyla güncellendi.'), findsOneWidget);
      expect(s.source.lastUpdatedPassword, 'yenisifre');
      expect(tester.widget<TextField>(_field(2)).controller?.text, isEmpty);
    });

    testWidgets('yanlış mevcut şifrede hata alanda gösterilir', (tester) async {
      final s = await signedInAuth();
      await _pump(tester, ProfileScreen(auth: s.auth));

      await tester.enterText(_field(2), 'yanlis-sifre');
      await tester.enterText(_field(3), 'yenisifre');
      await tester.enterText(_field(4), 'yenisifre');
      await tester.pump();
      await tester.tap(find.widgetWithText(FilledButton, 'Şifreyi güncelle'));
      await tester.pumpAndSettle();

      expect(find.text('E-posta veya şifre hatalı.'), findsOneWidget);
      expect(s.source.lastUpdatedPassword, isNull);
    });

    testWidgets('görünürlük düğmeleri şifreyi gösterir/gizler', (tester) async {
      final s = await signedInAuth();
      await _pump(tester, ProfileScreen(auth: s.auth));

      expect(tester.widget<TextField>(_field(2)).obscureText, isTrue);
      await tester.tap(find.byIcon(Icons.visibility_outlined).first);
      await tester.pump();
      expect(tester.widget<TextField>(_field(2)).obscureText, isFalse);

      expect(tester.widget<TextField>(_field(3)).obscureText, isTrue);
      await tester.tap(find.byIcon(Icons.visibility_outlined).last);
      await tester.pump();
      expect(tester.widget<TextField>(_field(3)).obscureText, isFalse);
    });
  });
}
