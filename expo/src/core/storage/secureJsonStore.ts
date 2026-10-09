import { secureSessionStorage } from './secureSessionStorage';

/**
 * Şifreli JSON deposu (Keychain/Keystore). Yerel abonelik cache'i ve mutation kuyruğu
 * bu depoda tutulur ([SECURITY.md](../../../../docs/architecture/SECURITY.md)).
 * Bozuk veya beklenmeyen biçimdeki değer yok sayılır; hata fırlatmaz.
 */
export async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await secureSessionStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await secureSessionStorage.setItem(key, JSON.stringify(value));
}

export async function removeJson(key: string): Promise<void> {
  await secureSessionStorage.removeItem(key);
}
