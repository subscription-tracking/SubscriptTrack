import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

class SupabaseExportRepository {
  SupabaseClient get _client => Supabase.instance.client;

  Future<String> createAndProcess() async {
    final requested = await _client.rpc('request_export_idempotent', params: {
      'p_idempotency_key': const Uuid().v4(),
    });
    final row = Map<String, dynamic>.from(requested as Map);
    final result = await _client.functions.invoke('process-export', body: {
      'export_id': row['id'],
    });
    final data = Map<String, dynamic>.from(result.data as Map);
    final url = data['download_url'] as String?;
    if (url == null || url.isEmpty) {
      throw StateError('Export linki üretilemedi.');
    }
    return url;
  }
}
