import { readJson, writeJson, removeJson } from '../../../core/storage/secureJsonStore';

/**
 * Uygulama kilidi durumu (şifreli depo). PIN'in kendisi değil, özeti ([pinRecord.ts](../../../core/security/pinRecord.ts)) saklanır.
 * Hatalı deneme sayacı ve bekleme bitişi de burada tutulur; uygulama yeniden başlasa da sıfırlanmaz.
 */

const KEYS = {
  pin: 'appLock.pin',
  biometric: 'appLock.biometric',
  timeout: 'appLock.timeoutMinutes',
  attempts: 'appLock.attempts',
} as const;

export interface AppLockState {
  pinRecord: string | null;
  biometric: boolean;
  timeoutMinutes: number;
  failed: number;
  /** Bekleme bitişi (epoch ms) veya null. */
  lockedUntil: number | null;
}

export async function readAppLock(): Promise<AppLockState> {
  const [pin, biometric, timeout, attempts] = await Promise.all([
    readJson(KEYS.pin),
    readJson(KEYS.biometric),
    readJson(KEYS.timeout),
    readJson(KEYS.attempts),
  ]);
  const record = (attempts ?? {}) as { failed?: unknown; lockedUntil?: unknown };
  return {
    pinRecord: typeof pin === 'string' ? pin : null,
    biometric: biometric === true,
    timeoutMinutes: typeof timeout === 'number' ? timeout : 0,
    failed: typeof record.failed === 'number' ? record.failed : 0,
    lockedUntil: typeof record.lockedUntil === 'number' ? record.lockedUntil : null,
  };
}

export async function writePinRecord(record: string | null): Promise<void> {
  if (record === null) await removeJson(KEYS.pin);
  else await writeJson(KEYS.pin, record);
  await removeJson(KEYS.attempts);
}

export async function writeBiometric(enabled: boolean): Promise<void> {
  await writeJson(KEYS.biometric, enabled);
}

export async function writeTimeoutMinutes(minutes: number): Promise<void> {
  await writeJson(KEYS.timeout, minutes);
}

export async function writeAttempts(failed: number, lockedUntil: number | null): Promise<void> {
  if (failed === 0 && lockedUntil === null) await removeJson(KEYS.attempts);
  else await writeJson(KEYS.attempts, { failed, lockedUntil });
}
