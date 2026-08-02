import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

import '../config/app_environment.dart';
import '../errors/app_exception.dart';
import 'token_provider.dart';

class ApiClient {
  ApiClient({
    required this.tokenProvider,
    http.Client? httpClient,
    String? baseUrl,
  })  : _http = httpClient ?? http.Client(),
        _baseUrl = (baseUrl ?? EnvironmentConfig.apiBaseUrl)
            .replaceAll(RegExp(r'/$'), '');

  final TokenProvider tokenProvider;
  final http.Client _http;
  final String _baseUrl;

  static const _timeout = Duration(seconds: 30);
  static const _maxRetries = 3;
  static const _uuid = Uuid();

  // ── Public verbs ────────────────────────────────────────────────

  Future<Map<String, dynamic>> get(String path) => _request('GET', path);

  Future<Map<String, dynamic>> post(
          String path, Map<String, dynamic> body) =>
      _request('POST', path, body: body, idempotencyKey: _uuid.v4());

  Future<Map<String, dynamic>> patch(
          String path, [Map<String, dynamic>? body]) =>
      _request('PATCH', path, body: body, idempotencyKey: _uuid.v4());

  Future<void> delete(String path) => _request('DELETE', path);

  // ── Core ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? idempotencyKey,
    int attempt = 1,
  }) async {
    final token = await tokenProvider.getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': _uuid.v4(),
      if (token != null) 'Authorization': 'Bearer $token',
      if (idempotencyKey != null) 'Idempotency-Key': idempotencyKey,
    };

    final uri = Uri.parse('$_baseUrl$path');
    final req = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) req.body = jsonEncode(body);

    try {
      final stream = await _http.send(req).timeout(_timeout);
      final response = await http.Response.fromStream(stream);

      // 5xx: retry with back-off (same idempotency key so server deduplicates)
      if (response.statusCode >= 500 && attempt < _maxRetries) {
        await Future.delayed(Duration(milliseconds: 400 * attempt));
        return _request(method, path,
            body: body,
            idempotencyKey: idempotencyKey,
            attempt: attempt + 1);
      }

      return _parse(response);
    } on SocketException {
      throw const NetworkException('İnternet bağlantısı yok.');
    } on TimeoutException {
      if (attempt < _maxRetries) {
        await Future.delayed(Duration(milliseconds: 400 * attempt));
        return _request(method, path,
            body: body,
            idempotencyKey: idempotencyKey,
            attempt: attempt + 1);
      }
      throw const NetworkException('Sunucu zaman aşımı.');
    }
  }

  Map<String, dynamic> _parse(http.Response res) {
    // 2xx success
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return const {};
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) return decoded;
      return {'data': decoded};
    }

    // Error — try to extract backend message
    Map<String, dynamic> errorBody = {};
    try {
      errorBody = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {}

    final message = (errorBody['error']?['message'] as String?) ??
        (errorBody['message'] as String?) ??
        'HTTP ${res.statusCode}';

    switch (res.statusCode) {
      case 400:
      case 422:
        throw ValidationException(message);
      case 401:
      case 403:
        throw AuthException(message);
      case 404:
        throw NotFoundException(message);
      default:
        throw NetworkException(message);
    }
  }
}
