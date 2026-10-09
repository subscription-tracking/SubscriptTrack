import * as Crypto from 'expo-crypto';

/**
 * PIN özeti (uygulama kilidi). Kayıt biçimi: `v1:<tur>:<tuz>:<özet>`. Tuz rastgele, özet
 * tuz + PIN'in yinelemeli SHA-256'sı. Ham PIN hiçbir yerde saklanmaz.
 *
 * Not: Flutter sürümü PBKDF2 (30 000 tur) kullanır. Expo'da PBKDF2 yerleşik değildir; bu
 * yüzden yinelemeli SHA-256 kullanılıyor. Tur sayısı cihazda ölçülerek ayarlanmalıdır
 * ([SECURITY.md](../../../../../docs/architecture/SECURITY.md)). Kayıt tur sayısını taşır.
 */

export const PIN_RECORD_VERSION = 'v1';
export const DEFAULT_ROUNDS = 2000;
const SALT_BYTES = 16;

async function sha256Hex(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function derivePin(pin: string, salt: string, rounds: number): Promise<string> {
  let digest = await sha256Hex(`${salt}:${pin}`);
  for (let round = 1; round < rounds; round += 1) {
    digest = await sha256Hex(`${salt}:${digest}`);
  }
  return digest;
}

export async function createPinRecord(pin: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  const salt = toHex(Crypto.getRandomBytes(SALT_BYTES));
  const digest = await derivePin(pin, salt, rounds);
  return `${PIN_RECORD_VERSION}:${rounds}:${salt}:${digest}`;
}

/** Sabit zamanlı karşılaştırma: uzunluk ve içerik farkı zamanlamadan sızmaz. */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function verifyPinRecord(pin: string, record: string): Promise<boolean> {
  const parts = record.split(':');
  if (parts.length !== 4 || parts[0] !== PIN_RECORD_VERSION) return false;
  const rounds = Number(parts[1]);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100_000) return false;
  const digest = await derivePin(pin, parts[2], rounds);
  return constantTimeEquals(digest, parts[3]);
}
