/// Yeni parola kuralı (kayıt, şifre sıfırlama, şifre değiştirme).
///
/// Sunucudaki Supabase "Minimum password length" ayarıyla aynı değer
/// olmalıdır (2026-10-01 güvenlik denetimi, F-03). **Giriş** ekranında
/// uzunluk dayatılmaz: eski ve daha kısa parolası olan mevcut kullanıcılar
/// giriş yapabilmelidir; kural yalnızca yeni parola belirlenirken uygulanır.
abstract final class PasswordPolicy {
  static const minLength = 10;

  /// Kısa açıklama (etiket ve ipuçları için).
  static const requirement = 'En az $minLength karakter';

  static const tooShortMessage = 'Şifre en az $minLength karakter olmalı.';

  static bool isValid(String? value) =>
      value != null && value.length >= minLength;

  /// `TextFormField.validator` olarak kullanılır (yeni parola alanları).
  static String? validateNew(String? value) {
    if (value == null || value.isEmpty) return 'Şifre gerekli.';
    if (!isValid(value)) return tooShortMessage;
    return null;
  }
}
