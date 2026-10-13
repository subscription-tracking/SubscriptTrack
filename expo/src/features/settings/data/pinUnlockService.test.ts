import { createPinUnlockService } from './pinUnlockService';
import { readAppLock, writeAttempts } from './appLockStore';

jest.mock('./appLockStore', () => ({ readAppLock: jest.fn(), writeAttempts: jest.fn(), writePinRecord: jest.fn() }));
jest.mock('../../../core/security/pinRecord', () => ({ verifyPinRecord: jest.fn().mockResolvedValue(false), pinRecordNeedsUpgrade: jest.fn(), createPinRecord: jest.fn() }));

it('serializes concurrent wrong PIN attempts using the persisted counter', async () => {
  let failed = 0;
  jest.mocked(readAppLock).mockImplementation(async () => ({ pinRecord: 'hash', failed, biometric: false, timeoutMinutes: 0, lockedUntil: null }));
  jest.mocked(writeAttempts).mockImplementation(async (_userId, value) => { failed = value; });
  const unlock = createPinUnlockService();
  await Promise.all([unlock('u1', '1111'), unlock('u1', '2222')]);
  expect(failed).toBe(2);
  expect(writeAttempts).toHaveBeenNthCalledWith(1, 'u1', 1, null);
  expect(writeAttempts).toHaveBeenNthCalledWith(2, 'u1', 2, null);
});
