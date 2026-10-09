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
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: requireEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
} as const;
