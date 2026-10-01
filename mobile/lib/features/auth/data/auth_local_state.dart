import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/errors/error_messages.dart';
import '../../../core/preferences/app_preferences.dart';
import '../../../core/services/offline_mutation_queue.dart';
import '../../../core/storage/local_storage.dart';

/// Kimlik doğrulama akışının yerel (SharedPreferences) yan durumu.
class AuthLocalState {
  const AuthLocalState._();

  /// Tanıtım turu henüz tamamlanmadıysa `true`.
  static Future<bool> onboardingNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('onboarding_done') != true;
  }

  /// Hesap silinince bildirim okundu bilgisini temizler; hata yutulur.
  static Future<void> clearNotificationReadState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('notif_read_ids');
    } catch (e) {
      logIgnoredError('AuthLocalState.clearReadIds', e);
    }
  }

  /// Sunucu kalıcı silmeyi onayladıktan sonra hesabın yerel verilerini siler.
  static Future<void> wipeAccountData({
    required LocalStorage storage,
    required String userId,
    AppPreferences? preferences,
  }) =>
      Future.wait([
        storage.deleteSubscriptions(userId),
        storage.deleteFinancialEvents(userId),
        OfflineMutationQueue(userId: userId).clear(),
        preferences?.clearAccountPaymentMethods() ?? Future<void>.value(),
        clearNotificationReadState(),
      ]);
}
