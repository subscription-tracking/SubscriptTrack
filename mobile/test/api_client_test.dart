import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:subscript_track/core/errors/app_exception.dart';
import 'package:subscript_track/core/network/api_client.dart';
import 'package:subscript_track/core/network/token_provider.dart';

// ── Fake token provider ──────────────────────────────────────────

class _NoToken implements TokenProvider {
  @override
  Future<String?> getToken() async => null;
}

class _BearerToken implements TokenProvider {
  @override
  Future<String?> getToken() async => 'test-jwt-token';
}

// ── Helpers ──────────────────────────────────────────────────────

ApiClient _client(
  http.Client mock, {
  TokenProvider? token,
}) =>
    ApiClient(
      tokenProvider: token ?? _NoToken(),
      httpClient: mock,
      baseUrl: 'https://api.test',
    );

http.Client _mock(int status, [Object? body]) => MockClient((req) async {
      final encoded =
          body != null ? jsonEncode(body) : '';
      return http.Response(encoded, status,
          headers: {'content-type': 'application/json'});
    });

http.Client _mockSequence(List<http.Response> responses) {
  var i = 0;
  return MockClient((_) async => responses[i++]);
}

// ── Tests ────────────────────────────────────────────────────────

void main() {
  group('ApiClient — başarılı istekler (S8)', () {
    test('GET 200 → body parse edilir', () async {
      final api = _client(_mock(200, {'data': 'ok'}));
      final res = await api.get('/test');
      expect(res['data'], 'ok');
    });

    test('POST 201 → body parse edilir', () async {
      final api = _client(_mock(201, {'data': {'id': '1'}}));
      final res = await api.post('/test', {'name': 'Netflix'});
      expect(res['data']['id'], '1');
    });

    test('PATCH 200 → body parse edilir', () async {
      final api = _client(_mock(200, {'data': {'id': '1', 'status': 'paused'}}));
      final res = await api.patch('/test/1', {'status': 'paused'});
      expect(res['data']['status'], 'paused');
    });

    test('DELETE 204 empty body → boş map döner', () async {
      final mock = MockClient((_) async => http.Response('', 204));
      final api = _client(mock);
      await expectLater(api.delete('/test/1'), completes);
    });

    test('200 boş body → boş map döner', () async {
      final mock = MockClient((_) async => http.Response('', 200));
      final api = _client(mock);
      final res = await api.get('/empty');
      expect(res, isEmpty);
    });
  });

  group('ApiClient — hata durumları (S8)', () {
    test('400 → ValidationException', () async {
      final api = _client(_mock(400, {'message': 'Alan eksik'}));
      expect(() => api.get('/test'), throwsA(isA<ValidationException>()));
    });

    test('401 → AuthException', () async {
      final api = _client(_mock(401, {'message': 'Yetkisiz'}));
      expect(() => api.get('/test'), throwsA(isA<AuthException>()));
    });

    test('403 → AuthException', () async {
      final api = _client(_mock(403, {'error': {'message': 'Yasak'}}));
      expect(() => api.get('/test'), throwsA(isA<AuthException>()));
    });

    test('404 → NotFoundException', () async {
      final api = _client(_mock(404, {'message': 'Bulunamadı'}));
      expect(() => api.get('/test'), throwsA(isA<NotFoundException>()));
    });

    test('422 → ValidationException', () async {
      final api = _client(_mock(422, {'message': 'Geçersiz veri'}));
      expect(() => api.post('/test', {}), throwsA(isA<ValidationException>()));
    });

    test('500 body mesajı kullanılır', () async {
      // maxRetries sonrası hata fırlatır — tüm denemeleri hızlıca tüketelim
      var calls = 0;
      final mock = MockClient((_) async {
        calls++;
        return http.Response(
            jsonEncode({'message': 'Sunucu hatası'}), 500,
            headers: {'content-type': 'application/json'});
      });
      final api = ApiClient(
        tokenProvider: _NoToken(),
        httpClient: mock,
        baseUrl: 'https://api.test',
      );
      await expectLater(
        () => api.get('/test'),
        throwsA(isA<NetworkException>()),
      );
      expect(calls, 3); // 3 deneme
    });
  });

  group('ApiClient — retry mekanizması (S8)', () {
    test('5xx ilk iki istekte → üçüncüde başarılı', () async {
      final responses = [
        http.Response('', 500, headers: {'content-type': 'application/json'}),
        http.Response('', 502, headers: {'content-type': 'application/json'}),
        http.Response(
            jsonEncode({'data': 'ok'}), 200,
            headers: {'content-type': 'application/json'}),
      ];
      final api = _client(_mockSequence(responses));
      final res = await api.get('/test');
      expect(res['data'], 'ok');
    });

    test('4xx → retry YOK, tek çağrı', () async {
      var calls = 0;
      final mock = MockClient((_) async {
        calls++;
        return http.Response(
            jsonEncode({'message': 'Bulunamadı'}), 404,
            headers: {'content-type': 'application/json'});
      });
      final api = _client(mock);
      await expectLater(
          () => api.get('/test'), throwsA(isA<NotFoundException>()));
      expect(calls, 1); // retry yok
    });
  });

  group('ApiClient — header\'lar (S8)', () {
    test('Bearer token Authorization header\'a eklenir', () async {
      String? capturedAuth;
      final mock = MockClient((req) async {
        capturedAuth = req.headers['Authorization'];
        return http.Response(jsonEncode({'ok': true}), 200,
            headers: {'content-type': 'application/json'});
      });
      final api = _client(mock, token: _BearerToken());
      await api.get('/test');
      expect(capturedAuth, 'Bearer test-jwt-token');
    });

    test('token yoksa Authorization header eklenmez', () async {
      String? capturedAuth;
      final mock = MockClient((req) async {
        capturedAuth = req.headers['Authorization'];
        return http.Response('{}', 200,
            headers: {'content-type': 'application/json'});
      });
      final api = _client(mock);
      await api.get('/test');
      expect(capturedAuth, isNull);
    });

    test('X-Request-ID her istekte farklı UUID', () async {
      final ids = <String>[];
      final mock = MockClient((req) async {
        final id = req.headers['X-Request-ID'];
        if (id != null) ids.add(id);
        return http.Response('{}', 200,
            headers: {'content-type': 'application/json'});
      });
      final api = _client(mock);
      await api.get('/a');
      await api.get('/b');
      expect(ids.length, 2);
      expect(ids[0], isNot(ids[1]));
    });

    test('Content-Type application/json gönderilir', () async {
      String? ct;
      final mock = MockClient((req) async {
        ct = req.headers['Content-Type'];
        return http.Response('{}', 200,
            headers: {'content-type': 'application/json'});
      });
      final api = _client(mock);
      await api.post('/test', {'key': 'val'});
      expect(ct, contains('application/json'));
    });
  });

  group('ApiClient — hata mesajı çözümleme (S8)', () {
    test('error.message alanı kullanılır', () async {
      final api = _client(
          _mock(400, {'error': {'message': 'İsim zorunlu'}}));
      try {
        await api.post('/test', {});
        fail('exception beklendi');
      } on ValidationException catch (e) {
        expect(e.message, 'İsim zorunlu');
      }
    });

    test('message alanı kullanılır', () async {
      final api = _client(_mock(404, {'message': 'Kayıt yok'}));
      try {
        await api.get('/test');
        fail('exception beklendi');
      } on NotFoundException catch (e) {
        expect(e.message, 'Kayıt yok');
      }
    });

    test('body yoksa "HTTP {status}" mesajı verilir', () async {
      final mock = MockClient((_) async => http.Response('', 400));
      final api = _client(mock);
      try {
        await api.get('/test');
        fail('exception beklendi');
      } on ValidationException catch (e) {
        expect(e.message, contains('400'));
      }
    });
  });
}
