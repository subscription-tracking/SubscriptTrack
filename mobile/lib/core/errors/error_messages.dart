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
  debugPrint('Beklenmeyen hata: $error');
  if (stackTrace != null) debugPrintStack(stackTrace: stackTrace);
  return _fallbackMessage;
}

/// Bilinçli olarak yutulan (best-effort) hataları en azından debug
/// günlüğüne yazar; kullanıcıya gösterilmez.
void logIgnoredError(String where, Object error) {
  debugPrint('[$where] yok sayıldı: $error');
}
