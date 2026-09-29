import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_environment.dart';

class SupportApiException implements Exception {
  const SupportApiException();

  @override
  String toString() => 'Destek servisi isteği başarısız.';
}

/// Servis kataloğu ve destek kaydı için backend (Edge Function) istemcisi.
class SupportCatalogApi {
  SupportCatalogApi({SupabaseClient? client})
      : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  /// Backend yapılandırılmış ve kullanıcı oturum açmışsa destek kaydı
  /// oluşturulabilir.
  static bool get canCreateTicket =>
      EnvironmentConfig.isSupabaseConfigured &&
      Supabase.instance.client.auth.currentUser != null;

  Future<void> createTicket({
    required String category,
    required String message,
  }) async {
    try {
      await _client.functions.invoke(
        'support-catalog',
        body: {'category': category, 'message': message},
      );
    } on FunctionException {
      throw const SupportApiException();
    }
  }

  Future<List<Map<String, dynamic>>> fetchCatalog() async {
    final result = await _client.functions
        .invoke('support-catalog', method: HttpMethod.get);
    final data = Map<String, dynamic>.from(result.data as Map);
    return (data['services'] as List? ?? [])
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList();
  }
}
