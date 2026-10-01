import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Ekran gizliliği (güvenlik denetimi F-17): uygulama kilidi açıkken Android'de
/// `FLAG_SECURE` (ekran görüntüsü ve son uygulamalar önizlemesi engellenir).
/// iOS ve web'de kanal yoktur; gizleme örtüsü Flutter katmanında çizilir.
class PrivacyScreen {
  const PrivacyScreen._();

  static const MethodChannel _channel =
      MethodChannel('com.subscripttrack.app/privacy');

  /// Testler kanalı kendi sahte uygulamasıyla değiştirir.
  @visibleForTesting
  static bool? lastSecure;

  static Future<void> setSecure(bool secure) async {
    lastSecure = secure;
    if (kIsWeb) return;
    try {
      await _channel.invokeMethod<void>('setSecure', {'secure': secure});
    } on MissingPluginException {
      // iOS/masaüstü: yerel uygulama yok, Flutter örtüsü yeterli.
    } on PlatformException catch (e) {
      logPrivacyError(e);
    }
  }

  @visibleForTesting
  static void logPrivacyError(Object e) {
    if (kDebugMode) debugPrint('[PrivacyScreen] yok sayıldı: $e');
  }
}
