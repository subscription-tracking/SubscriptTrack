import { runSessionCleanup } from '../../../core/security/sessionCleanup';
import { removeJson } from '../../../core/storage/secureJsonStore';
import { clearSubscriptionLocalData } from './subscriptionLocalStore';

jest.mock('../../../core/storage/secureJsonStore', () => ({ readJsonStrict: jest.fn(), writeJson: jest.fn(), removeJson: jest.fn().mockResolvedValue(undefined) }));

it('kullanıcının önbelleği ve kuyruğu silinir, çıkış temizliğine kayıtlıdır', async () => {
  await clearSubscriptionLocalData('u1');
  expect(removeJson).toHaveBeenCalledWith('subscriptions.cache.u1');
  expect(removeJson).toHaveBeenCalledWith('subscriptions.queue.u1');
  jest.mocked(removeJson).mockClear();
  await runSessionCleanup('u2', 'sign-out');
  expect(removeJson).toHaveBeenCalledWith('subscriptions.cache.u2');
});
