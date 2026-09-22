import 'package:supabase_flutter/supabase_flutter.dart' as sb;

class PaymentMethodsApiException implements Exception {
  const PaymentMethodsApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Ödeme yöntemi etiketleri için backend API istemcisi.
/// Mobil istemci bu veri için PostgREST tablosuna doğrudan yazmaz.
class PaymentMethodsApi {
  PaymentMethodsApi({sb.SupabaseClient? client})
      : _client = client ?? sb.Supabase.instance.client;

  final sb.SupabaseClient _client;

  Future<List<String>> load() async {
    try {
      final result = await _client.functions
          .invoke('payment-methods', method: sb.HttpMethod.get);
      final data = Map<String, dynamic>.from(result.data as Map);
      final methods = data['methods'];
      if (methods is! List) {
        throw const PaymentMethodsApiException('Geçersiz sunucu yanıtı.');
      }
      return methods.whereType<String>().toList(growable: false);
    } on sb.FunctionException catch (e) {
      throw PaymentMethodsApiException(_message(e.details));
    } catch (e) {
      if (e is PaymentMethodsApiException) rethrow;
      throw const PaymentMethodsApiException('Ödeme yöntemleri yüklenemedi.');
    }
  }

  Future<void> replace(List<String> methods) async {
    try {
      await _client.functions.invoke('payment-methods',
          method: sb.HttpMethod.put, body: {'methods': methods});
    } on sb.FunctionException catch (e) {
      throw PaymentMethodsApiException(_message(e.details));
    } catch (e) {
      if (e is PaymentMethodsApiException) rethrow;
      throw const PaymentMethodsApiException('Ödeme yöntemleri kaydedilemedi.');
    }
  }

  static String _message(Object? details) {
    if (details is Map && details['error'] is String) {
      return details['error'] as String;
    }
    return 'Ödeme yöntemleri kaydedilemedi.';
  }
}
