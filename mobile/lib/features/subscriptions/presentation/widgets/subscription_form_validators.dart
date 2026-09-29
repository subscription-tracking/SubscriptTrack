/// [SubscriptionForm] alan doğrulayıcıları. Saf fonksiyonlar; hata yoksa
/// `null`, varsa kullanıcıya gösterilecek metni döner. Yalnızca doğrulama
/// yapar — para hesabı için `Money.parse` kullanılır.
abstract final class SubscriptionFormValidators {
  static String? name(String? value) =>
      value == null || value.trim().isEmpty ? 'Ad boş olamaz' : null;

  static String? amount(String? value) {
    if (value == null || value.trim().isEmpty) return 'Tutar gir';
    return _isPositive(value) ? null : 'Geçerli tutar gir';
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
    final n = double.tryParse(value.replaceAll(',', '.'));
    return n != null && n > 0;
  }
}
