import { createSerialExecutor } from '../../../core/async/serialExecutor';
import { FREE_ATTEMPTS, lockoutMs } from '../domain/appLockRules';
import type { AppLockState } from '../domain/appLockState';

export interface PinUnlockDependencies {
  readAppLock: (userId: string) => Promise<AppLockState>;
  writeAttempts: (userId: string, failed: number, lockedUntil: number | null) => Promise<void>;
  writePinRecord: (userId: string, record: string) => Promise<void>;
  verifyPinRecord: (pin: string, record: string) => Promise<boolean>;
  pinRecordNeedsUpgrade: (record: string) => boolean;
  createPinRecord: (pin: string) => Promise<string>;
  now: () => number;
}

export function createPinUnlockCoordinator(dependencies: PinUnlockDependencies) {
  const { readAppLock, writeAttempts, writePinRecord, verifyPinRecord, pinRecordNeedsUpgrade, createPinRecord, now } = dependencies;
  const serial = createSerialExecutor();
  return (userId: string, pin: string) => {
    return serial(async () => {
      const stored = await readAppLock(userId);
      const remaining = Math.max(0, (stored.lockedUntil ?? 0) - now());
      if (remaining > 0) return { result: 'locked_out' as const, remaining, attemptsLeft: Math.max(0, FREE_ATTEMPTS - stored.failed) };
      if (!stored.pinRecord) return { result: 'ok' as const, remaining: 0, attemptsLeft: FREE_ATTEMPTS };
      if (await verifyPinRecord(pin, stored.pinRecord)) {
        if (pinRecordNeedsUpgrade(stored.pinRecord)) await writePinRecord(userId, await createPinRecord(pin));
        await writeAttempts(userId, 0, null);
        return { result: 'ok' as const, remaining: 0, attemptsLeft: FREE_ATTEMPTS };
      }
      const failed = stored.failed + 1;
      const wait = lockoutMs(failed);
      await writeAttempts(userId, failed, wait > 0 ? now() + wait : null);
      return { result: wait > 0 ? 'locked_out' as const : 'wrong' as const, remaining: wait, attemptsLeft: Math.max(0, FREE_ATTEMPTS - failed) };
    });
  };
}
