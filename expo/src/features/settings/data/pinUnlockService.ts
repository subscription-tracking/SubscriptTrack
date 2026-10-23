import { createPinRecord, pinRecordNeedsUpgrade, verifyPinRecord } from '../../../core/security/pinRecord';
import { readAppLock, writeAttempts, writePinRecord } from './appLockStore';
import { createPinUnlockCoordinator, type PinUnlockDependencies } from './pinUnlockCoordinator';

export function createPinUnlockService(dependencies: PinUnlockDependencies = {
  readAppLock, writeAttempts, writePinRecord, createPinRecord, pinRecordNeedsUpgrade, verifyPinRecord, now: Date.now,
}) {
  return createPinUnlockCoordinator(dependencies);
}
