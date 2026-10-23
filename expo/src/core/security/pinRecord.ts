import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Flutter ile aynı `v2:<tur>:<base64url tuz>:<base64url özet>` biçimi ve
 * PBKDF2-HMAC-SHA256 kullanılır. Önceki Expo v1 kayıtları yalnız doğrulama için korunur;
 * başarılı PIN girişinde v2'ye yükseltilir. Ham PIN saklanmaz.
 */

export const PIN_RECORD_VERSION = 'v2';
export const DEFAULT_ROUNDS = 30_000;
const SALT_BYTES = 16;
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    out += BASE64[a >> 2] + BASE64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) out += BASE64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) out += BASE64[c & 63];
  }
  // Dart's base64Url.encode retains '=' padding. Keep the serialized record
  // byte-for-byte compatible so Flutter can verify a PIN created by Expo.
  while (out.length % 4 !== 0) out += '=';
  return out;
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value) || value.length % 4 === 1) return null;
  const clean = value.replace(/=+$/, '');
  const bytes: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = BASE64.indexOf(clean[index]);
    const b = BASE64.indexOf(clean[index + 1]);
    const c = clean[index + 2] === undefined ? 0 : BASE64.indexOf(clean[index + 2]);
    const d = clean[index + 3] === undefined ? 0 : BASE64.indexOf(clean[index + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    bytes.push((a << 2) | (b >> 4));
    if (clean[index + 2] !== undefined) bytes.push(((b & 15) << 4) | (c >> 2));
    if (clean[index + 3] !== undefined) bytes.push(((c & 3) << 6) | d);
  }
  return new Uint8Array(bytes);
}

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
  if (!/^\d{4,8}$/.test(pin)) throw new RangeError('PIN 4–8 rakam olmalıdır.');
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 500_000) throw new RangeError('Geçersiz PIN tur sayısı.');
  const salt = Crypto.getRandomBytes(SALT_BYTES);
  const digest = await pbkdf2Async(sha256, pin, salt, { c: rounds, dkLen: 32 });
  return `${PIN_RECORD_VERSION}:${rounds}:${encodeBase64Url(salt)}:${encodeBase64Url(digest)}`;
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
  if (/^[0-9a-f]{64}$/.test(record)) return constantTimeEquals(await sha256Hex(pin), record);
  const parts = record.split(':');
  if (parts.length !== 4) return false;
  const rounds = Number(parts[1]);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 500_000) return false;
  if (parts[0] === 'v1') {
    if (!/^[0-9a-f]{32}$/.test(parts[2]) || !/^[0-9a-f]{64}$/.test(parts[3])) return false;
    return constantTimeEquals(await derivePin(pin, parts[2], rounds), parts[3]);
  }
  if (parts[0] !== PIN_RECORD_VERSION) return false;
  const salt = decodeBase64Url(parts[2]);
  const expected = decodeBase64Url(parts[3]);
  if (!salt || salt.length !== SALT_BYTES || !expected || expected.length !== 32) return false;
  const derived = await pbkdf2Async(sha256, pin, salt, { c: rounds, dkLen: expected.length });
  return constantTimeEquals(toHex(derived), toHex(expected));
}

export function pinRecordNeedsUpgrade(record: string): boolean {
  const parts = record.split(':');
  return parts[0] !== PIN_RECORD_VERSION || Number(parts[1]) < DEFAULT_ROUNDS;
}
