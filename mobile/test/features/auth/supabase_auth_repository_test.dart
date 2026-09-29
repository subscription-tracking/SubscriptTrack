import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:subscript_track/core/datasources/auth_data_source.dart';
import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/features/auth/data/supabase_auth_repository.dart';

import '../../support/mock_supabase.dart';

typedef _Handler = http.Response Function(RecordedRequest request);

String _b64(Map<String, Object?> json) =>
    base64Url.encode(utf8.encode(jsonEncode(json))).replaceAll('=', '');

/// İçeriği önemsiz ama biçimi geçerli bir JWT.
String _jwt() => '${_b64({'alg': 'HS256', 'typ': 'JWT'})}.'
    '${_b64({'sub': 'user-1', 'exp': 4102444800})}.imza';

Map<String, dynamic> _userJson({
  String email = 'kisi@example.com',
  Map<String, dynamic>? metadata,
}) =>
    {
      'id': 'user-1',
      'aud': 'authenticated',
      'role': 'authenticated',
      'email': email,
      'created_at': '2026-01-15T10:00:00Z',
      'app_metadata': <String, dynamic>{},
      'user_metadata': metadata ?? <String, dynamic>{},
    };

Map<String, dynamic> _sessionJson({Map<String, dynamic>? user}) => {
      'access_token': _jwt(),
      'token_type': 'bearer',
      'expires_in': 3600,
      'refresh_token': 'refresh-token',
      'user': user ?? _userJson(),
    };

http.Response _authError(String message,
        {int status = 400, String code = 'invalid_credentials'}) =>
    MockSupabase.ok({'code': status, 'error_code': code, 'msg': message},
        status: status);

void main() {
  late MockSupabase supabase;
  late _Handler handler;
  late SupabaseAuthRepository repo;

  setUp(() {
    handler = (r) => MockSupabase.ok({});
    supabase = MockSupabase((r) => handler(r));
    repo = SupabaseAuthRepository(client: supabase.client);
  });
  tearDown(() => supabase.dispose());

  test('oturum yokken currentUser null', () async {
    expect(await repo.currentUser(), isNull);
  });

  group('signIn', () {
    test('başarılı giriş kullanıcıyı eşler ve oturumu saklar', () async {
      handler = (r) => MockSupabase.ok(_sessionJson(
            user: _userJson(metadata: {'display_name': 'Ayşe'}),
          ));
      final user =
          await repo.signIn(email: 'kisi@example.com', password: 'sifre123');

      final request = supabase.requests.single;
      expect(request.path, '/auth/v1/token');
      expect(request.query['grant_type'], 'password');
      expect(request.json['email'], 'kisi@example.com');
      expect(request.json['password'], 'sifre123');
      expect(user.id, 'user-1');
      expect(user.email, 'kisi@example.com');
      expect(user.displayName, 'Ayşe');
      expect(user.createdAt, DateTime.utc(2026, 1, 15, 10));
      expect((await repo.currentUser())?.id, 'user-1');
    });

    test('hata mesajları Türkçeye çevrilir', () async {
      final cases = {
        'Invalid login credentials': 'E-posta veya şifre hatalı.',
        'User already registered': 'Bu e-posta zaten kayıtlı.',
        'Password should be at least 6 characters':
            'Şifre en az 6 karakter olmalı.',
        'Email rate limit exceeded': 'Çok fazla deneme. Lütfen biraz bekle.',
        'network down': 'Bağlantı hatası. İnternet bağlantını kontrol et.',
        'Something else': 'Something else',
      };
      for (final entry in cases.entries) {
        handler = (r) => _authError(entry.key);
        await expectLater(
          repo.signIn(email: 'a@b.co', password: 'x'),
          throwsA(isA<AuthException>()
              .having((e) => e.message, 'message', entry.value)),
          reason: entry.key,
        );
      }
    });
  });

  group('signUp', () {
    test('oturumsuz yanıt e-posta doğrulaması gerektirir', () async {
      handler = (r) => MockSupabase.ok(_userJson());
      final user =
          await repo.signUp(email: 'kisi@example.com', password: 'sifre123');

      expect(supabase.requests.single.path, '/auth/v1/signup');
      expect(user.email, 'kisi@example.com');
      expect(repo.lastSignUpRequiresEmailConfirmation, isTrue);
    });

    test('oturumlu yanıt doğrulama gerektirmez', () async {
      handler = (r) => MockSupabase.ok(_sessionJson());
      await repo.signUp(email: 'kisi@example.com', password: 'sifre123');
      expect(repo.lastSignUpRequiresEmailConfirmation, isFalse);
    });

    test('sunucu hatası yerelleştirilir', () async {
      handler = (r) =>
          _authError('User already registered', code: 'user_already_exists');
      await expectLater(
        repo.signUp(email: 'a@b.co', password: 'sifre123'),
        throwsA(isA<AuthException>()
            .having((e) => e.message, 'message', 'Bu e-posta zaten kayıtlı.')),
      );
    });
  });

  group('oturum açıkken işlemler', () {
    Future<void> signedIn() async {
      handler = (r) => MockSupabase.ok(_sessionJson());
      await repo.signIn(email: 'kisi@example.com', password: 'sifre123');
      supabase.requests.clear();
    }

    test('görünen ad güncellenir', () async {
      await signedIn();
      handler = (r) =>
          MockSupabase.ok(_userJson(metadata: {'display_name': 'Yeni Ad'}));
      final user = await repo.updateDisplayName('Yeni Ad');

      final request = supabase.requests.single;
      expect(request.method, 'PUT');
      expect(request.path, '/auth/v1/user');
      expect(request.json['data'], {'display_name': 'Yeni Ad'});
      expect(user.displayName, 'Yeni Ad');
    });

    test('şifre güncellenir', () async {
      await signedIn();
      handler = (r) => MockSupabase.ok(_userJson());
      await repo.updatePassword('yenisifre');
      expect(supabase.requests.single.json['password'], 'yenisifre');
    });

    test('şifre güncelleme hatası çevrilir', () async {
      await signedIn();
      handler = (r) => _authError('Password should be at least 6 characters',
          code: 'weak_password');
      await expectLater(
        repo.updatePassword('123'),
        throwsA(isA<AuthException>().having(
            (e) => e.message, 'message', 'Şifre en az 6 karakter olmalı.')),
      );
    });

    test('e-posta değişimi normalize edilir', () async {
      await signedIn();
      handler = (r) => MockSupabase.ok(_userJson(email: 'yeni@example.com'));
      final user = await repo.updateEmail('  YENI@Example.com ');
      expect(supabase.requests.single.json['email'], 'yeni@example.com');
      expect(user.email, 'yeni@example.com');
    });

    test('geçersiz e-posta sunucuya gitmeden reddedilir', () async {
      await signedIn();
      await expectLater(
          repo.updateEmail('gecersiz'), throwsA(isA<AuthException>()));
      await expectLater(repo.updateEmail('   '), throwsA(isA<AuthException>()));
      expect(supabase.requests, isEmpty);
    });

    test('çıkış oturumu kapatır', () async {
      await signedIn();
      handler = (r) => MockSupabase.ok(null, status: 204);
      await repo.signOut();
      expect(supabase.requests.single.path, '/auth/v1/logout');
      expect(await repo.currentUser(), isNull);
    });

    test('hesap silme Edge Function\'ı çağırır ve oturumu kapatır', () async {
      await signedIn();
      handler = (r) => r.path.startsWith('/functions/')
          ? MockSupabase.ok({'success': true})
          : MockSupabase.ok(null, status: 204);
      await repo.deleteAccount('kisi@example.com');

      expect(supabase.requests.first.path, '/functions/v1/delete-account');
      expect(supabase.requests.last.path, '/auth/v1/logout');
    });

    test('hesap silme hatası AuthException olur ve oturum kapanmaz', () async {
      await signedIn();
      handler = (r) => MockSupabase.ok({'error': 'yetki yok'}, status: 403);
      await expectLater(
        repo.deleteAccount('kisi@example.com'),
        throwsA(isA<AuthException>()
            .having((e) => e.message, 'message', contains('Hesap silinemedi'))),
      );
      expect((await repo.currentUser())?.id, 'user-1');
    });
  });

  test('şifre sıfırlama e-postası istenir', () async {
    handler = (r) => MockSupabase.ok({});
    await repo.sendPasswordResetEmail('kisi@example.com');
    final request = supabase.requests.single;
    expect(request.path, '/auth/v1/recover');
    expect(request.json['email'], 'kisi@example.com');
  });

  test('şifre sıfırlama hatası çevrilir', () async {
    handler = (r) => _authError('Email rate limit exceeded',
        status: 429, code: 'over_email_send_rate_limit');
    await expectLater(
      repo.sendPasswordResetEmail('a@b.co'),
      throwsA(isA<AuthException>().having((e) => e.message, 'message',
          'Çok fazla deneme. Lütfen biraz bekle.')),
    );
  });

  test('desteklenmeyen sosyal giriş sağlayıcısı reddedilir', () async {
    await expectLater(
      repo.signInWithProvider('facebook'),
      throwsA(isA<AuthException>().having(
          (e) => e.message, 'message', 'Desteklenmeyen giriş sağlayıcısı.')),
    );
  });

  test('oturum olayları uygulama olaylarına eşlenir', () async {
    final events = <AuthStateChange>[];
    final sub = repo.authStateChanges.listen(events.add);
    handler = (r) => MockSupabase.ok(_sessionJson());
    await repo.signIn(email: 'kisi@example.com', password: 'sifre123');
    handler = (r) => MockSupabase.ok(null, status: 204);
    await repo.signOut();
    await Future<void>.delayed(const Duration(milliseconds: 50));
    await sub.cancel();

    expect(
        events.map((e) => e.event),
        containsAllInOrder(
            [AuthStateEvent.signedIn, AuthStateEvent.signedOut]));
    final signedIn =
        events.firstWhere((e) => e.event == AuthStateEvent.signedIn);
    expect(signedIn.user?.email, 'kisi@example.com');
  });
}
