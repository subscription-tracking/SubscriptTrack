/**
 * Uygulama kilidi kuralları ([Flutter AppLockService](../../../../../mobile/lib/core/services/app_lock_service.dart) ile aynı):
 * PIN 4–8 rakam; 5 serbest denemeden sonra üstel bekleme (30 sn, en fazla 15 dk); arka plandan
 * dönüşte seçilen süre dolduysa kilit. I/O yoktur.
 */

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;
export const FREE_ATTEMPTS = 5;
export const MAX_LOCKOUT_MS = 15 * 60 * 1000;

/** Kilit süresi seçenekleri (dakika). 0 = arka plana geçince hemen kilitle. */
export const LOCK_TIMEOUT_OPTIONS_MINUTES = [0, 1, 5, 15] as const;

export function isValidPin(pin: string): boolean {
  return /^\d+$/.test(pin) && pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH;
}

/** [failed] hatalı denemeden sonraki bekleme süresi (ms). 0 = serbest. */
export function lockoutMs(failed: number): number {
  if (failed < FREE_ATTEMPTS) return 0;
  const exponent = Math.min(10, Math.max(0, failed - FREE_ATTEMPTS));
  return Math.min(MAX_LOCKOUT_MS, 30_000 * 2 ** exponent);
}

/**
 * Arka plandan dönüşte kilitlemeli mi? Saat geri alındıysa süre doğrulanamaz: kilitle.
 * `backgroundedAt` null ise (arka plana geçilmedi) kilitlenmez.
 */
export function shouldLockOnResume(backgroundedAt: number | null, now: number, timeoutMs: number): boolean {
  if (backgroundedAt === null) return false;
  if (now < backgroundedAt) return true;
  return now - backgroundedAt >= timeoutMs;
}
