import 'package:supabase_flutter/supabase_flutter.dart';

class SupportCatalogApi {
  SupportCatalogApi({SupabaseClient? client}) : _client = client ?? Supabase.instance.client;
  final SupabaseClient _client;

  Future<void> createTicket({required String category, required String message}) async {
    await _client.functions.invoke('support-catalog', body: {'category': category, 'message': message});
  }

  Future<List<Map<String, dynamic>>> fetchCatalog() async {
    final result = await _client.functions.invoke('support-catalog', method: HttpMethod.get);
    final data = Map<String, dynamic>.from(result.data as Map);
    return (data['services'] as List? ?? []).whereType<Map>().map((row) => Map<String, dynamic>.from(row)).toList();
  }
}
