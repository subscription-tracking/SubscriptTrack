import { clearAppLock, readAppLock, writePinRecord } from './appLockStore';
import { readJsonStrict, removeJson, writeJson } from '../../../core/storage/secureJsonStore';

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJsonStrict: jest.fn(), writeJson: jest.fn(), removeJson: jest.fn() }));
beforeEach(() => {
  jest.mocked(readJsonStrict).mockReset().mockResolvedValue(null);
  jest.mocked(writeJson).mockReset().mockResolvedValue(undefined);
  jest.mocked(removeJson).mockReset().mockResolvedValue(undefined);
});

it('treats absent settings as disabled lock', async () => {
  expect(await readAppLock('u1')).toMatchObject({ pinRecord: null, failed: 0, biometric: false });
});
it('rejects malformed PIN data instead of treating it as disabled', async () => {
  jest.mocked(readJsonStrict).mockImplementation(async (key) => key === 'appLock.pin.u1' ? {} : null);
  await expect(readAppLock('u1')).rejects.toThrow('doğrulanamadı');
});
it('rejects negative attempt counts', async () => {
  jest.mocked(readJsonStrict).mockImplementation(async (key) => key === 'appLock.attempts.u1' ? { failed: -1, lockedUntil: null } : null);
  await expect(readAppLock('u1')).rejects.toThrow('doğrulanamadı');
});
it('propagates storage failure', async () => {
  jest.mocked(readJsonStrict).mockRejectedValue(new Error('keystore unavailable'));
  await expect(readAppLock('u1')).rejects.toThrow('keystore unavailable');
});
it('PIN kaydı kullanıcıya bağlıdır; başka kullanıcı eski global kaydı görmez', async () => {
  const store: Record<string, unknown> = { 'appLock.pin.u1': 'hash-u1' };
  jest.mocked(readJsonStrict).mockImplementation(async (key) => store[key] ?? null);
  expect(await readAppLock('u2')).toMatchObject({ pinRecord: null });
  expect(await readAppLock('u1')).toMatchObject({ pinRecord: 'hash-u1' });
});
it('eski global anahtarlar ilk okumada kullanıcıya taşınır ve silinir', async () => {
  const store: Record<string, unknown> = { 'appLock.pin': 'old-hash', 'appLock.biometric': true, 'appLock.timeoutMinutes': 5 };
  jest.mocked(readJsonStrict).mockImplementation(async (key) => store[key] ?? null);
  jest.mocked(writeJson).mockImplementation(async (key, value) => { store[key] = value; });
  jest.mocked(removeJson).mockImplementation(async (key) => { delete store[key]; });
  expect(await readAppLock('u1')).toMatchObject({ pinRecord: 'old-hash', biometric: true, timeoutMinutes: 5 });
  expect(store['appLock.pin']).toBeUndefined();
  expect(store['appLock.pin.u1']).toBe('old-hash');
  expect(await readAppLock('u2')).toMatchObject({ pinRecord: null });
});
it('yazma ve silme kullanıcı anahtarını kullanır', async () => {
  await writePinRecord('u1', 'h');
  expect(writeJson).toHaveBeenCalledWith('appLock.pin.u1', 'h');
  await clearAppLock('u1');
  expect(removeJson).toHaveBeenCalledWith('appLock.pin.u1');
  expect(removeJson).toHaveBeenCalledWith('appLock.attempts.u1');
});
