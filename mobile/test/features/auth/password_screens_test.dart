import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';
import 'package:subscript_track/features/auth/presentation/screens/forgot_password_screen.dart';
import 'package:subscript_track/features/auth/presentation/screens/reset_password_screen.dart';

import '../../support/fake_auth.dart';

Future<({AuthController auth, FakeAuthDataSource source})> _auth() async {
  SharedPreferences.setMockInitialValues({'onboarding_done': true});
  final source = FakeAuthDataSource();
  final auth = AuthController(repository: source);
  return (auth: auth, source: source);
}

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('ForgotPasswordScreen', () {
    testWidgets('e-posta gönderimi kapalıyken bilgi ekranı gösterilir',
        (tester) async {
      final a = await _auth();
      await tester.pumpWidget(MaterialApp(
        home: ForgotPasswordScreen(
            controller: a.auth, emailResetAvailable: false),
      ));

      expect(find.text('Şifre sıfırlama kullanılamıyor'), findsOneWidget);
      expect(find.byType(TextFormField), findsNothing);
    });

    testWidgets('varsayılan (Supabase yok) bilgi ekranı gösterir',
        (tester) async {
      final a = await _auth();
      await tester.pumpWidget(
        MaterialApp(home: ForgotPasswordScreen(controller: a.auth)),
      );
      expect(find.text('Şifre sıfırlama kullanılamıyor'), findsOneWidget);
    });

    testWidgets('e-posta doğrulaması', (tester) async {
      final a = await _auth();
      await tester.pumpWidget(MaterialApp(
        home:
            ForgotPasswordScreen(controller: a.auth, emailResetAvailable: true),
      ));

      await tester.tap(find.text('Bağlantı gönder'));
      await tester.pump();
      expect(find.text('E-posta gerekli.'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField), 'gecersiz');
      await tester.tap(find.text('Bağlantı gönder'));
      await tester.pump();
      expect(find.text('Geçerli bir e-posta gir.'), findsOneWidget);
      expect(a.source.resetEmailCalls, 0);
    });

    testWidgets('başarılı gönderim onay ekranını gösterir', (tester) async {
      final a = await _auth();
      await tester.pumpWidget(MaterialApp(
        home:
            ForgotPasswordScreen(controller: a.auth, emailResetAvailable: true),
      ));

      await tester.enterText(find.byType(TextFormField), ' kisi@example.com ');
      await tester.tap(find.text('Bağlantı gönder'));
      await tester.pumpAndSettle();

      expect(a.source.lastResetEmail, 'kisi@example.com');
      expect(find.text('Mail gönderildi!'), findsOneWidget);
      expect(find.textContaining('kisi@example.com adresine'), findsOneWidget);
    });

    testWidgets('gönderim hatası formda gösterilir', (tester) async {
      final a = await _auth();
      a.source.failWith = 'Çok fazla deneme.';
      await tester.pumpWidget(MaterialApp(
        home:
            ForgotPasswordScreen(controller: a.auth, emailResetAvailable: true),
      ));

      await tester.enterText(find.byType(TextFormField), 'kisi@example.com');
      await tester.tap(find.text('Bağlantı gönder'));
      await tester.pumpAndSettle();

      expect(find.text('Çok fazla deneme.'), findsOneWidget);
      expect(find.text('Mail gönderildi!'), findsNothing);
    });

    testWidgets('onay ekranındaki düğme geri döner', (tester) async {
      final a = await _auth();
      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => ForgotPasswordScreen(
                      controller: a.auth, emailResetAvailable: false),
                ),
              ),
              child: const Text('aç'),
            ),
          ),
        ),
      ));
      await tester.tap(find.text('aç'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Giriş ekranına dön'));
      await tester.pumpAndSettle();
      expect(find.text('aç'), findsOneWidget);
    });
  });

  group('ResetPasswordScreen', () {
    Future<({AuthController auth, FakeAuthDataSource source})> pump(
        WidgetTester tester) async {
      final a = await _auth();
      await tester.binding.setSurfaceSize(const Size(400, 900));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(
        MaterialApp(home: ResetPasswordScreen(controller: a.auth)),
      );
      return a;
    }

    Finder field(int i) => find.byType(TextFormField).at(i);

    testWidgets('doğrulama mesajları', (tester) async {
      final a = await pump(tester);

      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      expect(find.text('Şifre gerekli.'), findsOneWidget);

      await tester.enterText(field(0), '123');
      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      expect(find.text('Şifre en az 6 karakter olmalı.'), findsOneWidget);

      await tester.enterText(field(0), 'yenisifre');
      await tester.enterText(field(1), 'baskasifre');
      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      expect(find.text('Şifreler eşleşmiyor.'), findsOneWidget);
      expect(a.source.lastUpdatedPassword, isNull);
    });

    testWidgets('geçerli şifre güncellenir ve bilgi verilir', (tester) async {
      final a = await pump(tester);
      await tester.enterText(field(0), 'yenisifre');
      await tester.enterText(field(1), 'yenisifre');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(a.source.lastUpdatedPassword, 'yenisifre');
      expect(find.text('Şifren başarıyla güncellendi!'), findsOneWidget);
      expect(a.auth.passwordRecoveryMode, isFalse);
    });

    testWidgets('sunucu hatası ekranda gösterilir', (tester) async {
      final a = await pump(tester);
      a.source.failWith = 'Bağlantı süresi doldu.';
      await tester.enterText(field(0), 'yenisifre');
      await tester.enterText(field(1), 'yenisifre');
      await tester.tap(find.byType(FilledButton));
      await tester.pumpAndSettle();

      expect(find.text('Bağlantı süresi doldu.'), findsOneWidget);
      expect(find.text('Şifren başarıyla güncellendi!'), findsNothing);
    });

    testWidgets('görünürlük düğmeleri her alanı ayrı ayrı değiştirir',
        (tester) async {
      await pump(tester);
      EditableText editable(int i) =>
          tester.widget<EditableText>(find.byType(EditableText).at(i));

      expect(editable(0).obscureText, isTrue);
      expect(editable(1).obscureText, isTrue);

      await tester.tap(find.byIcon(Icons.visibility_outlined).first);
      await tester.pump();
      expect(editable(0).obscureText, isFalse);
      expect(editable(1).obscureText, isTrue);

      await tester.tap(find.byIcon(Icons.visibility_outlined).last);
      await tester.pump();
      expect(editable(1).obscureText, isFalse);
    });
  });
}
