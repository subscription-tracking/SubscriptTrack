import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/auth/data/auth_repository.dart';

void main() {
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('AuthRepository (yerel kimlik doğrulama)', () {
    test('kayıt: e-posta normalize edilir, oturum açılır', () async {
      final repo = AuthRepository();
      final user =
          await repo.signUp(email: '  Kisi@Example.COM ', password: 'sifre123');
      expect(user.email, 'kisi@example.com');
      expect((await repo.currentUser())?.id, user.id);
    });

    test('kayıt doğrulamaları', () async {
      final repo = AuthRepository();
      expect(() => repo.signUp(email: ' ', password: 'sifre123'),
          throwsA(isA<AuthException>()));
      expect(() => repo.signUp(email: 'a@b.co', password: '123'),
          throwsA(isA<AuthException>()));
      await repo.signUp(email: 'a@b.co', password: 'sifre123');
      expect(
        () => repo.signUp(email: 'A@B.co', password: 'sifre123'),
        throwsA(isA<AuthException>()
            .having((e) => e.message, 'message', 'Bu e-posta zaten kayıtlı.')),
      );
    });

    test('giriş: doğru şifre oturum açar, yanlış şifre reddedilir', () async {
      final repo = AuthRepository();
      final created = await repo.signUp(email: 'a@b.co', password: 'sifre123');
      await repo.signOut();
      expect(await repo.currentUser(), isNull);

      expect(() => repo.signIn(email: 'a@b.co', password: 'yanlis1'),
          throwsA(isA<AuthException>()));
      expect(() => repo.signIn(email: 'yok@b.co', password: 'sifre123'),
          throwsA(isA<AuthException>()));

      final user = await repo.signIn(email: 'A@b.co', password: 'sifre123');
      expect(user.id, created.id);
      expect((await repo.currentUser())?.email, 'a@b.co');
    });

    test('bozuk oturum verisi null döner', () async {
      FlutterSecureStorage.setMockInitialValues({'current_user': '{bozuk'});
      expect(await AuthRepository().currentUser(), isNull);
    });

    test('şifre güncelleme eski şifreyi geçersiz kılar', () async {
      final repo = AuthRepository();
      await repo.signUp(email: 'a@b.co', password: 'sifre123');
      await repo.updatePassword('yenisifre');
      await repo.signOut();
      expect(() => repo.signIn(email: 'a@b.co', password: 'sifre123'),
          throwsA(isA<AuthException>()));
      expect((await repo.signIn(email: 'a@b.co', password: 'yenisifre')).email,
          'a@b.co');
    });

    test('şifre güncelleme doğrulamaları', () async {
      final repo = AuthRepository();
      expect(() => repo.updatePassword('123'), throwsA(isA<AuthException>()));
      expect(
          () => repo.updatePassword('yenisifre'), throwsA(isA<AuthException>()),
          reason: 'oturum yok');
    });

    test('görünen ad güncellenir ve kalıcıdır', () async {
      final repo = AuthRepository();
      await repo.signUp(email: 'a@b.co', password: 'sifre123');
      final updated = await repo.updateDisplayName('Ayşe');
      expect(updated.displayName, 'Ayşe');
      expect((await repo.currentUser())?.displayName, 'Ayşe');
      await repo.signOut();
      expect(
          (await repo.signIn(email: 'a@b.co', password: 'sifre123'))
              .displayName,
          'Ayşe');
    });

    test('görünen ad: oturum yoksa hata', () {
      expect(() => AuthRepository().updateDisplayName('X'),
          throwsA(isA<AuthException>()));
    });

    test('hesap silme kimlik bilgilerini ve oturumu kaldırır', () async {
      final repo = AuthRepository();
      await repo.signUp(email: 'a@b.co', password: 'sifre123');
      await repo.deleteAccount('a@b.co');
      expect(await repo.currentUser(), isNull);
      expect(() => repo.signIn(email: 'a@b.co', password: 'sifre123'),
          throwsA(isA<AuthException>()));
    });

    test('şifre sıfırlama e-postası yerel modda sessizce başarılıdır',
        () async {
      await AuthRepository().sendPasswordResetEmail('a@b.co');
    });

    test('yerel modda e-posta değiştirilemez', () {
      expect(() => AuthRepository().updateEmail('x@y.z'),
          throwsA(isA<AuthException>()));
    });
  });

  group('UnavailableAuthRepository', () {
    const repo = UnavailableAuthRepository();

    test('oturum yok, işlemler yapılandırma hatası verir', () async {
      expect(await repo.currentUser(), isNull);
      await repo.signOut();
      await repo.deleteAccount('a@b.co');
      for (final call in <Future<Object?> Function()>[
        () => repo.signIn(email: 'a@b.co', password: 'x'),
        () => repo.signUp(email: 'a@b.co', password: 'x'),
        () => repo.sendPasswordResetEmail('a@b.co'),
        () => repo.updatePassword('x'),
        () => repo.updateDisplayName('x'),
        () => repo.updateEmail('a@b.co'),
      ]) {
        await expectLater(call(), throwsA(isA<AuthException>()));
      }
    });
  });
}
