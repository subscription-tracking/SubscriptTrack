import * as SecureStore from 'expo-secure-store';

/**
 * Supabase oturum ve PKCE verifier deposu. Android'de Keystore, iOS'ta Keychain
 * kullanır; Flutter sürümündeki `SecureSupabaseStorage` / `SecurePkceStorage`
 * ile aynı güvenlik seviyesidir ([docs/architecture/SECURITY.md](../../../../docs/architecture/SECURITY.md)).
 *
 * SecureStore tek bir değer için yaklaşık 2 KB sınırı koyar. Supabase oturumu
 * bu sınırı aşabildiği için uzun değerler parçalara bölünür ve bir meta kayıtla
 * geri birleştirilir.
 */

/** Güvenli sınırın altında kalan parça boyutu (karakter). */
export const CHUNK_SIZE = 1800;

const CHUNK_MARKER = '__chunks__:';

function partKey(key: string, index: number): string {
  return `${key}.part${index}`;
}

function sanitizeKey(key: string): string {
  // SecureStore yalnızca alfanümerik, nokta, tire ve alt çizgi kabul eder.
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

export const secureSessionStorage = {
  async getItem(rawKey: string): Promise<string | null> {
    const key = sanitizeKey(rawKey);
    const head = await SecureStore.getItemAsync(key);
    if (head === null || !head.startsWith(CHUNK_MARKER)) return head;

    const count = Number(head.slice(CHUNK_MARKER.length));
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await SecureStore.getItemAsync(partKey(key, i));
      if (part === null) return null; // Eksik parça: değer bozuk, yok say.
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(rawKey: string, value: string): Promise<void> {
    const key = sanitizeKey(rawKey);
    await removeChunks(key);

    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      parts.push(value.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < parts.length; i += 1) {
      await SecureStore.setItemAsync(partKey(key, i), parts[i]);
    }
    await SecureStore.setItemAsync(key, `${CHUNK_MARKER}${parts.length}`);
  },

  async removeItem(rawKey: string): Promise<void> {
    const key = sanitizeKey(rawKey);
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};

async function removeChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head === null || !head.startsWith(CHUNK_MARKER)) return;
  const count = Number(head.slice(CHUNK_MARKER.length));
  for (let i = 0; i < count; i += 1) {
    await SecureStore.deleteItemAsync(partKey(key, i));
  }
}
