import '../../../../core/domain/money.dart';
import '../../domain/subscription_models.dart';

/// [SubscriptionForm] alan doğrulayıcıları. Saf fonksiyonlar; hata yoksa
/// `null`, varsa kullanıcıya gösterilecek metni döner. Yalnızca doğrulama
/// yapar — para hesabı için `Money.parse` kullanılır.
abstract final class SubscriptionFormValidators {
  static String? name(String? value) =>
      value == null || value.trim().isEmpty ? 'Ad boş olamaz' : null;

  static String? amount(String? value) {
    if (value == null || value.trim().isEmpty) return 'Tutar gir';
    final amount = Money.parse(value.trim());
    if (amount.minorUnits <= 0) return 'Geçerli tutar gir';
    if (amount.minorUnits > SubscriptionLimits.maxAmountMinorUnits) {
      return 'Tutar çok yüksek';
    }
    return null;
  }

  static String? trialPrice(
    String? value, {
    required bool isTrial,
    required DateTime? trialEndDate,
  }) {
    if (!isTrial) return null;
    if (trialEndDate == null) return 'Deneme bitiş tarihini seç';
    return _isPositive(value ?? '')
        ? null
        : 'Geçerli bir deneme sonrası fiyatı gir';
  }

  static bool _isPositive(String value) {
    return Money.parse(value.trim()).minorUnits > 0;
  }
}
