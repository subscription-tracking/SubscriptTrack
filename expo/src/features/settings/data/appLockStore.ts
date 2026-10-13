import type { AppLockState } from '../domain/appLockState';
import { registerSessionCleaner } from '../../../core/security/sessionCleanup';
import { readJsonStrict, writeJson, removeJson } from '../../../core/storage/secureJsonStore';
export type { AppLockState } from '../domain/appLockState';

/**
 * Uygulama kilidi durumu (şifreli depo). PIN'in kendisi değil, özeti ([pinRecord.ts](../../../core/security/pinRecord.ts)) saklanır.
 * Hatalı deneme sayacı ve bekleme bitişi de burada tutulur; uygulama yeniden başlasa da sıfırlanmaz.
 */

const NAMES = {
  pin: 'appLock.pin',
  biometric: 'appLock.biometric',
  timeout: 'appLock.timeoutMinutes',
  attempts: 'appLock.attempts',
} as const;
type Field = keyof typeof NAMES;
const FIELDS = Object.keys(NAMES) as Field[];

/** Kilit kayıtları kullanıcıya bağlıdır; başka hesabın PIN'i bu hesaba geçmez. */
const keyFor = (userId: string, field: Field) => `${NAMES[field]}.${userId}`;

/**
 * Eski (kullanıcısız) global anahtarlar ilk okumada o an hydrate olan kullanıcıya taşınır ve silinir.
 * Kullanıcının kendi kaydı varsa eskiye dokunulmaz (başka bir hesap taşıyabilir).
 */
async function migrateLegacyKeys(userId: string): Promise<void> {
  if (await readJsonStrict(keyFor(userId, 'pin')) !== null) return;
  const legacyPin = await readJsonStrict(NAMES.pin);
  if (legacyPin === null) return;
  for (const field of FIELDS) {
    const legacy = field === 'pin' ? legacyPin : await readJsonStrict(NAMES[field]);
    if (legacy !== null) await writeJson(keyFor(userId, field), legacy);
  }
  for (const field of FIELDS) await removeJson(NAMES[field]);
}

/** Hesap silme: kullanıcıya bağlı tüm kilit kayıtlarını siler. */
export async function clearAppLock(userId: string): Promise<void> {
  for (const field of FIELDS) await removeJson(keyFor(userId, field));
}

// Çıkışta kilit kaydı kullanıcıya bağlı kaldığı için silinmez; yalnızca hesap silmede temizlenir.
registerSessionCleaner('app-lock', async (userId, reason) => { if (reason === 'account-deleted') await clearAppLock(userId); });

export async function readAppLock(userId: string): Promise<AppLockState> {
  await migrateLegacyKeys(userId);
  const [pin, biometric, timeout, attempts] = await Promise.all(FIELDS.map((field) => readJsonStrict(keyFor(userId, field))));
  const record = (attempts ?? {}) as { failed?: unknown; lockedUntil?: unknown };
  if ((pin !== null && typeof pin !== 'string')
    || (biometric !== null && typeof biometric !== 'boolean')
    || (timeout !== null && (typeof timeout !== 'number' || !Number.isFinite(timeout) || timeout < 0))
    || (attempts !== null && (typeof attempts !== 'object' || Array.isArray(attempts)
      || typeof record.failed !== 'number' || !Number.isSafeInteger(record.failed) || record.failed < 0
      || (record.lockedUntil !== null && (typeof record.lockedUntil !== 'number' || !Number.isFinite(record.lockedUntil)))))) {
    throw new Error('Güvenli kilit kaydı doğrulanamadı.');
  }
  return {
    pinRecord: typeof pin === 'string' ? pin : null,
    biometric: biometric === true,
    timeoutMinutes: typeof timeout === 'number' ? timeout : 0,
    failed: typeof record.failed === 'number' ? record.failed : 0,
    lockedUntil: typeof record.lockedUntil === 'number' ? record.lockedUntil : null,
  };
}

export async function writePinRecord(userId: string, record: string | null): Promise<void> {
  if (record === null) await removeJson(keyFor(userId, 'pin'));
  else await writeJson(keyFor(userId, 'pin'), record);
  await removeJson(keyFor(userId, 'attempts'));
}

export async function writeBiometric(userId: string, enabled: boolean): Promise<void> {
  await writeJson(keyFor(userId, 'biometric'), enabled);
}

export async function writeTimeoutMinutes(userId: string, minutes: number): Promise<void> {
  await writeJson(keyFor(userId, 'timeout'), minutes);
}

export async function writeAttempts(userId: string, failed: number, lockedUntil: number | null): Promise<void> {
  if (failed === 0 && lockedUntil === null) await removeJson(keyFor(userId, 'attempts'));
  else await writeJson(keyFor(userId, 'attempts'), { failed, lockedUntil });
}
