/**
 * Istemci yapilandirmasi. Degerler `EXPO_PUBLIC_*` ortam degiskenlerinden okunur;
 * Expo bu degiskenleri derleme aninda gomer, bu yuzden erisim noktalari
 * `process.env.EXPO_PUBLIC_...` olarak yazilmak zorundadir (dinamik erisim calismaz).
 *
 * Yalnizca publishable (anon) anahtar burada olabilir. Service-role anahtari
 * istemciye asla girmez ([API.md](../../../../docs/reference/API.md) §1).
 */

function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `${name} tanimli degil. expo/.env.example dosyasina bakin ve expo/.env olusturun.`,
    );
  }
  return trimmed;
}

export const env = {
  softDeletionEnabled: process.env.EXPO_PUBLIC_SOFT_DELETION_ENABLED === 'true',
  timezoneModeEnabled: process.env.EXPO_PUBLIC_TIMEZONE_MODE_ENABLED === 'true',
  atomicRenewalEnabled: process.env.EXPO_PUBLIC_ATOMIC_RENEWAL_ENABLED === 'true',
  /** Migration 037 (`record_deferred_payment_idempotent`) canlıya uygulanana kadar kapalı tutulur. */
  idempotentDeferredEnabled: process.env.EXPO_PUBLIC_IDEMPOTENT_DEFERRED_ENABLED === 'true',
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: requireEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
} as const;
