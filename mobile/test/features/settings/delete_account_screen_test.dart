import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/settings/presentation/screens/delete_account_screen.dart';

import '../../support/fake_auth.dart';

Future<void> _pump(WidgetTester tester, AuthController auth) async {
  await tester.binding.setSurfaceSize(const Size(400, 1000));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(MaterialApp(home: DeleteAccountScreen(auth: auth)));
}

FilledButton _deleteButton(WidgetTester tester) => tester.widget<FilledButton>(
    find.widgetWithText(FilledButton, 'Hesabı kalıcı olarak sil'));

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  testWidgets('şifre ve "sil" onayı girilmeden buton pasif', (tester) async {
    final s = await signedInAuth();
    await _pump(tester, s.auth);
    expect(_deleteButton(tester).onPressed, isNull);

    await tester.enterText(find.byType(TextFormField), 'sifre123');
    await tester.pump();
    expect(_deleteButton(tester).onPressed, isNull, reason: 'onay yok');

    await tester.enterText(find.byType(TextField).last, 'yanlış');
    await tester.pump();
    expect(_deleteButton(tester).onPressed, isNull);

    await tester.enterText(find.byType(TextField).last, ' SİL '.toLowerCase());
    await tester.pump();
    expect(_deleteButton(tester).onPressed, isNotNull);
  });

  testWidgets('boş şifre butonu pasif bırakır (uzunluk dayatılmaz, F-03)',
      (tester) async {
    final s = await signedInAuth();
    await _pump(tester, s.auth);
    await tester.enterText(find.byType(TextFormField), '');
    await tester.enterText(find.byType(TextField).last, 'sil');
    await tester.pump();
    expect(_deleteButton(tester).onPressed, isNull);
  });

  testWidgets('şifre görünürlüğü değiştirilir', (tester) async {
    final s = await signedInAuth();
    await _pump(tester, s.auth);
    EditableText field() =>
        tester.widget<EditableText>(find.byType(EditableText).first);
    expect(field().obscureText, isTrue);
    await tester.tap(find.byIcon(Icons.visibility_outlined));
    await tester.pump();
    expect(field().obscureText, isFalse);
  });

  testWidgets('yanlış şifrede hata gösterilir ve hesap silinmez',
      (tester) async {
    final s = await signedInAuth();
    await _pump(tester, s.auth);

    await tester.enterText(find.byType(TextFormField), 'yanlis-sifre');
    await tester.enterText(find.byType(TextField).last, 'sil');
    await tester.pump();
    await tester
        .tap(find.widgetWithText(FilledButton, 'Hesabı kalıcı olarak sil'));
    await tester.pumpAndSettle();

    expect(find.text('E-posta veya şifre hatalı.'), findsOneWidget);
    expect(s.source.deleteCalls, 0);
    expect(_deleteButton(tester).onPressed, isNotNull,
        reason: 'yeniden denenebilir');
  });

  testWidgets('doğru şifre ve onayla hesap silinir, oturum kapanır',
      (tester) async {
    final s = await signedInAuth();
    await _pump(tester, s.auth);

    await tester.enterText(find.byType(TextFormField), 'sifre123');
    await tester.enterText(find.byType(TextField).last, 'sil');
    await tester.pump();
    await tester
        .tap(find.widgetWithText(FilledButton, 'Hesabı kalıcı olarak sil'));
    // Başarıda ekran, router yönlendirene kadar yükleme durumunda kalır
    // (sonsuz animasyon), bu yüzden pumpAndSettle kullanılamaz.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(s.source.deleteCalls, 1);
    expect(s.auth.status, AuthStatus.unauthenticated);
    expect(s.auth.user, isNull);
  });

  testWidgets('sunucu silme hatası ekranda gösterilir, oturum korunur',
      (tester) async {
    final s = await signedInAuth();
    s.source.deleteFailure = 'Sunucu hesabı silemedi.';
    await _pump(tester, s.auth);

    await tester.enterText(find.byType(TextFormField), 'sifre123');
    await tester.enterText(find.byType(TextField).last, 'sil');
    await tester.pump();
    await tester
        .tap(find.widgetWithText(FilledButton, 'Hesabı kalıcı olarak sil'));
    await tester.pumpAndSettle();

    expect(find.text('Sunucu hesabı silemedi.'), findsOneWidget);
    expect(s.auth.status, AuthStatus.authenticated);
    expect(_deleteButton(tester).onPressed, isNotNull);
  });
}
