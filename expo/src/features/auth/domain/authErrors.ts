import { PASSWORD_TOO_SHORT } from './authRules';

/**
 * Supabase Auth hata metnini kullanıcıya gösterilecek Türkçe mesaja çevirir.
 * Flutter `SupabaseAuthRepository._localizeError` ile aynı eşleşme kuralları.
 * Eşleşmeyen metin olduğu gibi döner; boş metin genel mesaja düşer.
 */

const RULES: ReadonlyArray<{ patterns: readonly string[]; message: string }> = [
  {
    patterns: ['invalid login credentials', 'invalid email or password'],
    message: 'E-posta veya şifre hatalı.',
  },
  {
    patterns: ['already registered', 'already been registered', 'already exists'],
    message: 'Bu e-posta zaten kayıtlı.',
  },
  { patterns: ['password should be at least'], message: PASSWORD_TOO_SHORT },
  { patterns: ['rate limit'], message: 'Çok fazla deneme. Lütfen biraz bekle.' },
  { patterns: ['network'], message: 'Bağlantı hatası. İnternet bağlantını kontrol et.' },
];

export const GENERIC_AUTH_ERROR = 'Bir hata oluştu.';

export function localizeAuthError(message: string | null | undefined): string {
  const lower = message?.toLowerCase() ?? '';
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => lower.includes(pattern))) return rule.message;
  }
  return message?.trim() ? message : GENERIC_AUTH_ERROR;
}

/** Bir hatayı ekranda gösterilecek metne çevirir. Beklenmeyen hatalar genel mesaja düşer. */
export function messageForError(error: unknown): string {
  if (error instanceof Error) return localizeAuthError(error.message);
  return GENERIC_AUTH_ERROR;
}
