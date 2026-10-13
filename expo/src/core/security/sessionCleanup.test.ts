import { registerSessionCleaner, runSessionCleanup } from './sessionCleanup';

it('kayıtlı temizleyicileri kullanıcı ve nedenle çalıştırır; biri çökse de diğerleri sürer', async () => {
  const ok = jest.fn(async () => undefined);
  registerSessionCleaner('test-ok', ok);
  registerSessionCleaner('test-bad', async () => { throw new Error('x'); });
  const failed = await runSessionCleanup('u1', 'sign-out');
  expect(ok).toHaveBeenCalledWith('u1', 'sign-out');
  expect(failed).toEqual(['test-bad']);
});

it('aynı ad tekrar kaydedilince eskisinin yerini alır', async () => {
  const first = jest.fn(async () => undefined);
  const second = jest.fn(async () => undefined);
  registerSessionCleaner('test-replace', first);
  registerSessionCleaner('test-replace', second);
  await runSessionCleanup('u1', 'account-deleted');
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledWith('u1', 'account-deleted');
});
