import { createPinUnlockCoordinator, type PinUnlockDependencies } from './pinUnlockCoordinator';
import type { AppLockState } from '../domain/appLockState';

function setup() {
  let state: AppLockState = { pinRecord: 'old-hash', biometric: false, timeoutMinutes: 0, failed: 0, lockedUntil: null };
  const dependencies: PinUnlockDependencies = {
    readAppLock: async () => state,
    writeAttempts: jest.fn(async (_userId, failed, lockedUntil) => { state = { ...state, failed, lockedUntil }; }),
    writePinRecord: jest.fn(async (_userId, pinRecord) => { state = { ...state, pinRecord }; }),
    verifyPinRecord: jest.fn(async () => false), pinRecordNeedsUpgrade: () => true,
    createPinRecord: async () => 'upgraded-hash', now: () => 1000,
  };
  return { dependencies, state: () => state, unlock: () => createPinUnlockCoordinator(dependencies) };
}

it('uses injected persistence and clock to enforce lockout after five wrong attempts', async () => {
  const test = setup();
  const unlock = test.unlock();
  const results = await Promise.all(Array.from({ length: 6 }, () => unlock('u1', '0000')));
  expect(results[4]).toMatchObject({ result: 'locked_out', remaining: 30000 });
  expect(results[5]).toMatchObject({ result: 'locked_out', remaining: 30000 });
  expect(test.state()).toMatchObject({ failed: 5, lockedUntil: 31000 });
  expect(test.dependencies.verifyPinRecord).toHaveBeenCalledTimes(5);
});

it('upgrades a verified PIN before clearing attempts', async () => {
  const test = setup();
  jest.mocked(test.dependencies.verifyPinRecord).mockResolvedValue(true);
  expect(await test.unlock()('u1', '1234')).toMatchObject({ result: 'ok' });
  expect(test.state()).toMatchObject({ pinRecord: 'upgraded-hash', failed: 0, lockedUntil: null });
  expect(jest.mocked(test.dependencies.writePinRecord).mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(test.dependencies.writeAttempts).mock.invocationCallOrder[0]);
});

it('rejects failed persistence and allows a later retry on the same serial executor', async () => {
  const test = setup();
  jest.mocked(test.dependencies.writeAttempts).mockRejectedValueOnce(new Error('storage unavailable'));
  const unlock = test.unlock();
  await expect(unlock('u1', '0000')).rejects.toThrow('storage unavailable');
  expect(await unlock('u1', '0000')).toMatchObject({ result: 'wrong' });
});
it('restored lockout persists across service instances until the stored deadline', async () => {
  const test = setup();
  const first = test.unlock();
  for (let i=0; i<5; i++) await first('u1', '0000');
  expect(await test.unlock()('u1', '1234')).toMatchObject({ result: 'locked_out', remaining: 30000 });
  test.dependencies.now = () => 32000;
  jest.mocked(test.dependencies.verifyPinRecord).mockResolvedValue(true);
  expect(await test.unlock()('u1', '1234')).toMatchObject({ result: 'ok' });
});
it('upgrade write failure does not clear attempts or return success', async () => {
  const test=setup();jest.mocked(test.dependencies.verifyPinRecord).mockResolvedValue(true);
  jest.mocked(test.dependencies.writePinRecord).mockRejectedValue(new Error('upgrade storage'));
  await expect(test.unlock()('u1', '1234')).rejects.toThrow('upgrade storage');
  expect(test.dependencies.writeAttempts).not.toHaveBeenCalled();
});
