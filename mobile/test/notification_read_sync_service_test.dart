import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:subscript_track/core/network/api_client.dart';
import 'package:subscript_track/core/network/token_provider.dart';
import 'package:subscript_track/core/services/notification_read_sync_service.dart';

class _StaticTokenProvider implements TokenProvider {
  @override
  Future<String?> getToken() async => 'test-token';
}

ApiClient _client(MockClient mock) => ApiClient(
      tokenProvider: _StaticTokenProvider(),
      httpClient: mock,
      baseUrl: 'https://api.test',
    );

void main() {
  group('NotificationReadSyncService (S11/S12)', () {
    test('boş set → API çağrısı yapılmaz', () async {
      var called = false;
      final mock = MockClient((_) async {
        called = true;
        return http.Response('{}', 200);
      });
      final svc = NotificationReadSyncService(_client(mock));
      await svc.syncRead({});
      expect(called, isFalse);
    });

    test('ID listesi POST /v1/notifications/read-batch ile gönderilir',
        () async {
      Map<String, dynamic>? sentBody;
      final mock = MockClient((req) async {
        expect(req.url.path, '/api/v1/notifications/read-batch');
        sentBody = jsonDecode(req.body) as Map<String, dynamic>;
        return http.Response('{"status":"ok"}', 200);
      });
      final svc = NotificationReadSyncService(_client(mock));
      await svc.syncRead({'id1', 'id2'});
      expect(sentBody, isNotNull);
      final ids = (sentBody!['notification_ids'] as List).cast<String>();
      expect(ids, containsAll(['id1', 'id2']));
    });

    test('API hata döndürse de exception fırlatmaz (best-effort)', () async {
      final mock = MockClient((_) async => http.Response('Server Error', 500));
      final svc = NotificationReadSyncService(_client(mock));
      await expectLater(svc.syncRead({'id1'}), completes);
    });

    test('ağ hatası exception fırlatmaz (best-effort)', () async {
      final mock = MockClient((_) async => throw Exception('no network'));
      final svc = NotificationReadSyncService(_client(mock));
      await expectLater(svc.syncRead({'id1'}), completes);
    });

    test('tek ID gönderilir', () async {
      Map<String, dynamic>? body;
      final mock = MockClient((req) async {
        body = jsonDecode(req.body) as Map<String, dynamic>;
        return http.Response('{}', 200);
      });
      final svc = NotificationReadSyncService(_client(mock));
      await svc.syncRead({'only-id'});
      expect((body!['notification_ids'] as List).length, 1);
      expect((body!['notification_ids'] as List).first, 'only-id');
    });
  });
}
