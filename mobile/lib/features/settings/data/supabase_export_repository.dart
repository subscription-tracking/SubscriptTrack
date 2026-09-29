import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../core/config/app_environment.dart';

class ExportException implements Exception {
  const ExportException(this.message);
  final String message;

  @override
  String toString() => message;
}

class SupabaseExportRepository {
  SupabaseExportRepository({SupabaseClient? client, bool? configured})
      : _injected = client,
        _configured = configured;

  final SupabaseClient? _injected;
  final bool? _configured;

  SupabaseClient get _client => _injected ?? Supabase.instance.client;

  Future<String> createAndProcess() async {
    if (!(_configured ?? EnvironmentConfig.isSupabaseConfigured)) {
      throw const ExportException(
          'Bulut üzerinden dışa aktarma bu sürümde kullanılamıyor.');
    }
    try {
      final requested = await _client.rpc('request_export_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
      });
      final row = Map<String, dynamic>.from(requested as Map);
      final exportId = row['id'];
      if (exportId is! String || exportId.isEmpty) {
        throw const ExportException('Dışa aktarma isteği oluşturulamadı.');
      }
      final result = await _client.functions.invoke('process-export', body: {
        'export_id': exportId,
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      final url = data['download_url'] as String?;
      if (url == null || url.isEmpty) {
        throw const ExportException('İndirme bağlantısı oluşturulamadı.');
      }
      return url;
    } on FunctionException {
      throw const ExportException(
          'Bulut üzerinden dışa aktarma şu anda kullanılamıyor. Lütfen tekrar dene.');
    } catch (e) {
      if (e is ExportException) rethrow;
      throw const ExportException(
          'Bulut üzerinden dışa aktarma şu anda kullanılamıyor. Lütfen tekrar dene.');
    }
  }
}
