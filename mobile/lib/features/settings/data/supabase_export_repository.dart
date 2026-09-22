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
  SupabaseClient get _client => Supabase.instance.client;

  Future<String> createAndProcess() async {
    if (!EnvironmentConfig.isSupabaseConfigured) {
      throw const ExportException('Bulut export bu sürümde yapılandırılmamış.');
    }
    try {
      final requested = await _client.rpc('request_export_idempotent', params: {
        'p_idempotency_key': const Uuid().v4(),
      });
      final row = Map<String, dynamic>.from(requested as Map);
      final exportId = row['id'];
      if (exportId is! String || exportId.isEmpty) {
        throw const ExportException('Export isteği oluşturulamadı.');
      }
      final result = await _client.functions.invoke('process-export', body: {
        'export_id': exportId,
      });
      final data = Map<String, dynamic>.from(result.data as Map);
      final url = data['download_url'] as String?;
      if (url == null || url.isEmpty) {
        throw const ExportException('Export linki üretilemedi.');
      }
      return url;
    } on FunctionException catch (e) {
      throw ExportException(_message(e.details));
    } catch (e) {
      if (e is ExportException) rethrow;
      throw const ExportException(
          'Bulut export şu anda oluşturulamadı. Lütfen tekrar dene.');
    }
  }

  static String _message(Object? details) {
    if (details is Map && details['error'] is String) {
      return details['error'] as String;
    }
    return 'Bulut export şu anda oluşturulamadı. Lütfen tekrar dene.';
  }
}
