import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/preferences/app_preferences.dart';
import 'package:subscript_track/features/auth/presentation/auth_controller.dart';

import '../../support/fake_auth.dart';

/// Oturum olayları, sosyal giriş ve e-posta doğrulaması destekleyen kaynak.
class _RichAuth extends FakeAuthDataSource
    implements
        AuthStateDataSource,
        EmailConfirmationDataSource,
        SocialAuthDataSource {
  final events = StreamController<AuthStateChange>.broadcast();
  @override
  bool lastSignUpRequiresEmailConfirmation = false;
  bool socialStarted = true;
  bool socialThrows = false;
  String? lastProvider;

  @override
  Stream<AuthStateChange> get authStateChanges => events.stream;

  @override
  Future<bool> signInWithProvider(String provider) async {
    lastProvider = provider;
    if (socialThrows) throw const AuthException('Sağlayıcı reddetti.');
    return socialStarted;
  }
}

AppUser _user([String email = 'kisi@example.com']) =>
    AppUser(id: 'u1', email: email, createdAt: DateTime(2026));

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'onboarding_done': true});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('oturum olayları (AuthStateDataSource)', () {
    test('signedIn oturumu açar, signedOut kapatır', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      await auth.init();
      expect(auth.status, AuthStatus.unauthenticated);

      source.events.add(AuthStateChange(AuthStateEvent.signedIn, _user()));
      await Future<void>.delayed(Duration.zero);
      expect(auth.status, AuthStatus.authenticated);
      expect(auth.user?.email, 'kisi@example.com');

      source.events.add(const AuthStateChange(AuthStateEvent.signedOut, null));
      await Future<void>.delayed(Duration.zero);
      expect(auth.status, AuthStatus.unauthenticated);
      expect(auth.user, isNull);
    });

    test('kullanıcısız signedIn/tokenRefreshed yok sayılır', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      await auth.init();

      source.events.add(const AuthStateChange(AuthStateEvent.signedIn, null));
      source.events
          .add(const AuthStateChange(AuthStateEvent.tokenRefreshed, null));
      await Future<void>.delayed(Duration.zero);
      expect(auth.status, AuthStatus.unauthenticated);
    });

    test('tokenRefreshed kullanıcıyı günceller', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      await auth.init();
      source.events
          .add(AuthStateChange(AuthStateEvent.signedIn, _user('a@b.co')));
      source.events
          .add(AuthStateChange(AuthStateEvent.tokenRefreshed, _user('c@d.co')));
      await Future<void>.delayed(Duration.zero);
      expect(auth.user?.email, 'c@d.co');
    });

    test('passwordRecovery kurtarma modunu açar; userUpdated kapatır',
        () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      await auth.init();

      source.events
          .add(const AuthStateChange(AuthStateEvent.passwordRecovery, null));
      await Future<void>.delayed(Duration.zero);
      expect(auth.passwordRecoveryMode, isTrue);

      source.events
          .add(AuthStateChange(AuthStateEvent.userUpdated, _user('y@z.co')));
      await Future<void>.delayed(Duration.zero);
      expect(auth.passwordRecoveryMode, isFalse);
      expect(auth.user?.email, 'y@z.co');
    });

    test('userUpdated kullanıcı taşımıyorsa mevcut kullanıcı korunur',
        () async {
      final source = _RichAuth()..user = _user('eski@b.co');
      final auth = AuthController(repository: source);
      await auth.init();
      source.events
          .add(const AuthStateChange(AuthStateEvent.userUpdated, null));
      await Future<void>.delayed(Duration.zero);
      expect(auth.user?.email, 'eski@b.co');
    });

    test('dispose sonrası olaylar dinlenmez', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      await auth.init();
      auth.dispose();
      expect(source.events.hasListener, isFalse);
    });
  });

  group('kayıt', () {
    test('e-posta doğrulaması gerekirse oturum açılmaz ve mesaj verilir',
        () async {
      final source = _RichAuth()..lastSignUpRequiresEmailConfirmation = true;
      final auth = AuthController(repository: source);
      final ok = await auth.signUp('kisi@example.com', 'sifre123');

      expect(ok, isFalse);
      expect(auth.emailVerificationRequired, isTrue);
      expect(auth.user, isNull);
      expect(auth.status, AuthStatus.unauthenticated);
      expect(auth.error, contains('e-postanı doğrula'));
    });

    test('doğrulama gerekmiyorsa oturum açılır', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      expect(await auth.signUp('kisi@example.com', 'sifre123'), isTrue);
      expect(auth.status, AuthStatus.authenticated);
      expect(auth.emailVerificationRequired, isFalse);
    });

    test('kayıt hatası mesajı controller\'a yansır', () async {
      final source = FakeAuthDataSource()
        ..failWith = 'Bu e-posta zaten kayıtlı.';
      final auth = AuthController(repository: source);
      expect(await auth.signUp('a@b.co', 'sifre123'), isFalse);
      expect(auth.error, 'Bu e-posta zaten kayıtlı.');
      expect(auth.loading, isFalse);
    });
  });

  group('sosyal giriş', () {
    test('desteklemeyen kaynakta açıklayıcı hata', () async {
      final auth = AuthController(repository: FakeAuthDataSource());
      expect(await auth.signInWithProvider('google'), isFalse);
      expect(auth.error, contains('Supabase modunda'));
    });

    test('başlatılırsa true, sağlayıcı adı iletilir', () async {
      final source = _RichAuth();
      final auth = AuthController(repository: source);
      expect(await auth.signInWithProvider('apple'), isTrue);
      expect(source.lastProvider, 'apple');
      expect(auth.error, isNull);
    });

    test('başlatılamazsa false; hata olursa mesaj', () async {
      final source = _RichAuth()..socialStarted = false;
      final auth = AuthController(repository: source);
      expect(await auth.signInWithProvider('google'), isFalse);

      source.socialThrows = true;
      expect(await auth.signInWithProvider('google'), isFalse);
      expect(auth.error, 'Sağlayıcı reddetti.');
    });
  });

  group('hesap işlemleri', () {
    test('oturum yokken şifre değiştirme reddedilir', () async {
      final auth = AuthController(repository: FakeAuthDataSource());
      expect(
        await auth.changePassword(
            currentPassword: 'x', newPassword: 'yenisifre'),
        isFalse,
      );
      expect(auth.error, 'Oturum bulunamadı.');
    });

    test('yanlış mevcut şifrede şifre değişmez', () async {
      final s = await signedInAuth();
      expect(
        await s.auth.changePassword(
            currentPassword: 'yanlis', newPassword: 'yenisifre'),
        isFalse,
      );
      expect(s.source.lastUpdatedPassword, isNull);
      expect(s.auth.error, 'E-posta veya şifre hatalı.');
    });

    test('e-posta değişimi desteklemeyen kaynakta hata verir', () async {
      final auth = AuthController(repository: _NoEmailUpdate());
      expect(await auth.updateEmail('x@y.z'), isFalse);
      expect(auth.error, 'Bu giriş modunda e-posta değiştirilemez.');
    });

    test('hesap silme: kullanıcı yoksa hiçbir şey yapmaz', () async {
      final source = FakeAuthDataSource();
      final auth = AuthController(repository: source);
      await auth.deleteAccount();
      expect(source.deleteCalls, 0);
    });

    test('hesap silme: yerel tercihleri temizler ve oturumu kapatır', () async {
      final source = FakeAuthDataSource(user: _user());
      final prefs = InMemoryAppPreferences();
      await prefs.addPaymentMethod('Nakit');
      final auth = AuthController(repository: source, settings: prefs);
      await auth.init();

      await auth.deleteAccount();

      expect(source.deleteCalls, 1);
      expect(prefs.paymentMethods, defaultPaymentMethods);
      expect(auth.status, AuthStatus.unauthenticated);
    });

    test('tanıtım turu bayrakları', () async {
      final auth = AuthController(repository: FakeAuthDataSource());
      await auth.init();
      expect(auth.onboardingNeeded, isFalse);
      auth.restartOnboarding();
      expect(auth.onboardingNeeded, isTrue);
      auth.onboardingDone();
      expect(auth.onboardingNeeded, isFalse);
    });

    test('clearError hatayı temizler ve dinleyicileri bilgilendirir', () async {
      final auth = AuthController(
        repository: FakeAuthDataSource()..failWith = 'Hata',
      );
      await auth.signIn('a@b.co', 'x');
      expect(auth.error, isNotNull);
      var notified = 0;
      auth.addListener(() => notified++);
      auth.clearError();
      expect(auth.error, isNull);
      expect(notified, 1);
    });
  });
}

class _NoEmailUpdate implements AuthDataSource {
  @override
  Future<AppUser?> currentUser() async => null;
  @override
  Future<AppUser> signUp({required String email, required String password}) =>
      throw UnimplementedError();
  @override
  Future<AppUser> signIn({required String email, required String password}) =>
      throw UnimplementedError();
  @override
  Future<void> signOut() async {}
  @override
  Future<void> deleteAccount(String email) async {}
  @override
  Future<void> sendPasswordResetEmail(String email) async {}
  @override
  Future<void> updatePassword(String newPassword) async {}
  @override
  Future<AppUser> updateDisplayName(String name) => throw UnimplementedError();
}
