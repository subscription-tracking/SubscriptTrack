/**
 * Kimlik doğrulama kuralları. Flutter `PasswordPolicy` ve form doğrulamalarının
 * birebir karşılığıdır ([auth ekranları](../../../../../mobile/lib/features/auth/presentation/screens/)).
 *
 * Parola kuralı yalnızca **yeni** parola belirlenirken uygulanır (kayıt, şifre
 * sıfırlama). Giriş ekranında uzunluk dayatılmaz; eski ve kısa parolası olan
 * kullanıcılar giriş yapabilmelidir.
 */

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_REQUIREMENT = `En az ${PASSWORD_MIN_LENGTH} karakter`;
export const PASSWORD_TOO_SHORT = `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`;

export function isValidNewPassword(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.length >= PASSWORD_MIN_LENGTH;
}

/** Yeni parola alanı için doğrulama mesajı. Geçerliyse `null`. */
export function validateNewPassword(value: string | null | undefined): string | null {
  if (!value) return 'Şifre gerekli.';
  if (!isValidNewPassword(value)) return PASSWORD_TOO_SHORT;
  return null;
}

/** Giriş alanı için doğrulama: yalnızca dolu olmasına bakar. */
export function validateLoginPassword(value: string | null | undefined): string | null {
  return value ? null : 'Şifre gerekli.';
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
  mismatchMessage: string = 'Şifreler eşleşmiyor.',
): string | null {
  return password === confirmation ? null : mismatchMessage;
}

/**
 * Şifre sıfırlama e-posta alanı (Flutter `ForgotPasswordScreen`). Boş ve "@"
 * içermeyen girdi reddedilir. Gerçek e-posta doğrulaması sunucu tarafında yapılır.
 */
export function validateEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return 'E-posta gerekli.';
  if (!trimmed.includes('@')) return 'Geçerli bir e-posta gir.';
  return null;
}

/**
 * Giriş ve kayıt e-posta alanı (Flutter `AuthEmailField`). Metin, şifre sıfırlama
 * ekranından farklı olarak nokta içermez; ikisi de Flutter'daki gibi tutulur.
 */
export function validateAuthEmail(value: string | null | undefined): string | null {
  return value && value.includes('@') ? null : 'Geçerli bir e-posta gir';
}

/** Kayıt ekranındaki parola tekrarı mesajı (Flutter: nokta yok). */
export const PASSWORD_MISMATCH_REGISTER = 'Şifreler eşleşmiyor';
/** Yeni şifre ekranındaki parola tekrarı mesajı (Flutter: nokta var). */
export const PASSWORD_MISMATCH_RESET = 'Şifreler eşleşmiyor.';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
