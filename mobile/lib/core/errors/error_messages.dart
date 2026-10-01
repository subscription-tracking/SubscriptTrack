import 'package:flutter/foundation.dart';

import 'app_exception.dart';

const _fallbackMessage = 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.';

/// Kullanıcıya gösterilebilecek hata metni üretir.
///
/// [AppException] mesajları zaten kullanıcıya yönelik olduğundan aynen
/// döner. Diğer tüm istisnalar (SDK, ağ, ayrıştırma hataları) teknik ayrıntı
/// sızdırmasın diye genel bir mesaja çevrilir; ayrıntı yalnızca debug
/// günlüğüne yazılır.
String userMessageFor(Object error, {StackTrace? stackTrace}) {
  if (error is AppException) return error.message;
  // debugPrint release derlemede de logcat'e yazar; ham hata (SDK/sunucu
  // ayrıntısı) yalnızca debug'da günlüğe gider (güvenlik denetimi F-14).
  if (kDebugMode) {
    debugPrint('Beklenmeyen hata: $error');
    if (stackTrace != null) debugPrintStack(stackTrace: stackTrace);
  }
  return _fallbackMessage;
}

/// Bilinçli olarak yutulan (best-effort) hataları en azından debug
/// günlüğüne yazar; kullanıcıya gösterilmez.
void logIgnoredError(String where, Object error) {
  if (!kDebugMode) return;
  debugPrint('[$where] yok sayıldı: $error');
}

/// PostgREST/Postgres hatasını uygulama istisnasına çevirir.
///
/// 23514 (`check_violation`): sunucudaki veri bütünlüğü kısıtları (migration 033)
/// uygulama doğrulamasını aşan bir değeri reddetti; teknik kısıt adı yerine
/// anlaşılır bir mesaj gösterilir.
AppException dbException(String? code, String message) => code == '23514'
    ? const ValidationException(
        'Girilen değerler izin verilen sınırların dışında. Alanları kontrol et.')
    : NetworkException(message);
