import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// [MockSupabase] üzerinden geçen bir HTTP isteğinin kaydı.
class RecordedRequest {
  RecordedRequest(this.method, this.url, this.body, this.headers);

  final String method;
  final Uri url;
  final String body;
  final Map<String, String> headers;

  String get path => url.path;
  Map<String, dynamic> get json => jsonDecode(body) as Map<String, dynamic>;
  Map<String, String> get query => url.queryParameters;

  @override
  String toString() => '$method $url $body';
}

/// Gerçek `SupabaseClient`'ı sahte bir HTTP istemcisiyle çalıştırır; depo
/// sınıflarının PostgREST/RPC/Edge Function isteklerini ağa çıkmadan sınar.
class MockSupabase {
  MockSupabase(this._respond) {
    client = SupabaseClient(
      'https://test.supabase.co',
      'test-anon-key',
      // PKCE, kalıcı bir asyncStorage ister; testte gerekmez.
      authOptions: const AuthClientOptions(
        authFlowType: AuthFlowType.implicit,
        autoRefreshToken: false,
      ),
      httpClient: MockClient((request) async {
        final recorded = RecordedRequest(
          request.method,
          request.url,
          request.body,
          request.headers,
        );
        requests.add(recorded);
        final response = _respond(recorded);
        // postgrest, yanıtın `request` alanının dolu olmasını bekler.
        return http.Response(
          response.body,
          response.statusCode,
          request: request,
          headers: response.headers,
        );
      }),
    );
  }

  final http.Response Function(RecordedRequest request) _respond;
  final List<RecordedRequest> requests = [];
  late final SupabaseClient client;

  static http.Response ok(Object? body, {int status = 200}) => http.Response(
        jsonEncode(body),
        status,
        headers: {'content-type': 'application/json; charset=utf-8'},
      );

  /// PostgREST hata gövdesi.
  static http.Response error(String message,
          {int status = 400, String code = 'PGRST000'}) =>
      ok({'message': message, 'code': code, 'details': null, 'hint': null},
          status: status);

  Future<void> dispose() => client.dispose();
}
