import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createSerialExecutor } from '../async/serialExecutor';

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
const HEAD_PATTERN = /^__chunks__:(\d+)(?::([0-9a-z]+))?$/;

/** Aynı anahtara yazma/silme/okuma işlemleri sırayla çalışır; okuyucu yarım yazım görmez. */
const serial = createSerialExecutor();

let generationSeq = 0;
function newGeneration(): string {
  generationSeq += 1;
  return `${Date.now().toString(36)}${generationSeq.toString(36)}`;
}

/** `gen` yoksa eski biçim (`key.part<i>`), varsa yeni nesil (`key.g<gen>.part<i>`). */
function partKey(key: string, index: number, gen?: string): string {
  return gen ? `${key}.g${gen}.part${index}` : `${key}.part${index}`;
}

interface ChunkHead { count: number; gen?: string }

/** Başlık biçimi bozuksa `invalid` döner. */
function parseHead(head: string): ChunkHead | 'invalid' {
  const match = HEAD_PATTERN.exec(head);
  const count = match ? Number(match[1]) : NaN;
  if (!match || !Number.isSafeInteger(count) || count <= 0) return 'invalid';
  return { count, gen: match[2] };
}

function sanitizeKey(key: string): string {
  // SecureStore yalnızca alfanümerik, nokta, tire ve alt çizgi kabul eder.
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function deleteParts(key: string, head: ChunkHead): Promise<void> {
  for (let i = 0; i < head.count; i += 1) {
    try {
      await SecureStore.deleteItemAsync(partKey(key, i, head.gen));
    } catch {
      // Yetim parça zararsızdır; asıl değer zaten yazılmıştır.
    }
  }
}

async function readHead(key: string): Promise<ChunkHead | null> {
  try {
    const head = await SecureStore.getItemAsync(key);
    if (head === null || !head.startsWith(CHUNK_MARKER)) return null;
    const parsed = parseHead(head);
    return parsed === 'invalid' ? null : parsed;
  } catch {
    return null;
  }
}

const nativeStorage = {
  async getItem(rawKey: string, strict = false): Promise<string | null> {
    const key = sanitizeKey(rawKey);
    return serial(async () => {
      const head = await SecureStore.getItemAsync(key);
      if (head === null || !head.startsWith(CHUNK_MARKER)) return head;

      const parsed = parseHead(head);
      if (parsed === 'invalid') {
        if (strict) throw new Error('Güvenli depo parça bilgisi geçersiz.');
        return null;
      }
      const parts: string[] = [];
      for (let i = 0; i < parsed.count; i += 1) {
        const part = await SecureStore.getItemAsync(partKey(key, i, parsed.gen));
        if (part === null) {
          if (strict) throw new Error('Güvenli depo parçası eksik.');
          return null;
        }
        parts.push(part);
      }
      return parts.join('');
    });
  },

  /**
   * Atomik yazım: yeni nesil parçaları önce yazılır, başlık en son. Araya hata girerse eski başlık
   * (ve eski parçalar) dokunulmadan kalır; eski nesil ancak başlık yazıldıktan sonra silinir.
   */
  async setItem(rawKey: string, value: string): Promise<void> {
    const key = sanitizeKey(rawKey);
    return serial(async () => {
      const oldHead = await readHead(key);

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        if (oldHead) await deleteParts(key, oldHead);
        return;
      }

      const parts: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        parts.push(value.slice(i, i + CHUNK_SIZE));
      }
      const gen = newGeneration();
      try {
        for (let i = 0; i < parts.length; i += 1) {
          await SecureStore.setItemAsync(partKey(key, i, gen), parts[i]);
        }
        await SecureStore.setItemAsync(key, `${CHUNK_MARKER}${parts.length}:${gen}`);
      } catch (error) {
        await deleteParts(key, { count: parts.length, gen }); // Yarım yeni nesli temizle; eski değer okunabilir kalır.
        throw error;
      }
      if (oldHead) await deleteParts(key, oldHead);
    });
  },

  async removeItem(rawKey: string): Promise<void> {
    const key = sanitizeKey(rawKey);
    return serial(async () => {
      const oldHead = await readHead(key);
      await SecureStore.deleteItemAsync(key);
      if (oldHead) await deleteParts(key, oldHead);
    });
  },
};

/**
 * Yalnızca web önizlemesi için: `expo-secure-store` web'de yoktur. Tarayıcı depolaması güvenli depo değildir;
 * bu adaptör üretim web'i için kullanılmamalıdır (uygulama web'e yayınlanmaz, yalnızca tasarım kontrolü içindir).
 */
const webStorage = {
  async getItem(key: string, _strict = false): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

export const secureSessionStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
