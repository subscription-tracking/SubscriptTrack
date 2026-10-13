import { createSubscription, updateSubscription, recordSubscriptionEvent } from './subscriptionWriteRepository';
import { isTransientCode } from './transientErrors';

const mockRpc = jest.fn();
const mockInsert = jest.fn();
jest.mock('../../../core/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args), from: () => ({ insert: (...args: unknown[]) => mockInsert(...args) }) },
}));
beforeEach(() => { mockRpc.mockReset(); mockInsert.mockReset(); jest.useRealTimers(); });

const create = { p_idempotency_key: 'k' } as never;
const update = { p_idempotency_key: 'k', p_subscription_id: 's' } as never;

it.each([undefined, '40001', '40P01', '57014', 'PGRST000', '08006', '08003', '53300', '57P01', '42501'])('geçici/oturum kodu %s yeniden denenir', async (code) => {
  mockRpc.mockResolvedValue({ data: null, error: { code } });
  await expect(createSubscription(create)).rejects.toMatchObject({ retryable: true });
  await expect(updateSubscription(update)).rejects.toMatchObject({ retryable: true });
});

it.each(['23514', 'P0002', '23505', 'PGRST202'])('kalıcı kod %s reddedilir', async (code) => {
  mockRpc.mockResolvedValue({ data: null, error: { code } });
  await expect(updateSubscription(update)).rejects.toMatchObject({ retryable: false });
});

it('olay yazımı aynı sınıflamayı kullanır', async () => {
  mockInsert.mockResolvedValue({ error: { code: '40001' } });
  await expect(recordSubscriptionEvent('u', 's', { eventType: 'STATUS_CHANGED', payload: {} })).rejects.toMatchObject({ retryable: true });
  mockInsert.mockResolvedValue({ error: { code: '23503' } });
  await expect(recordSubscriptionEvent('u', 's', { eventType: 'STATUS_CHANGED', payload: {} })).rejects.toMatchObject({ retryable: false });
});

it('yanıt vermeyen RPC zaman aşımında yeniden denenebilir hata verir', async () => {
  jest.useFakeTimers();
  mockRpc.mockReturnValue(new Promise(() => undefined));
  const pending = expect(createSubscription(create)).rejects.toMatchObject({ retryable: true, name: 'SubscriptionWriteError' });
  await jest.advanceTimersByTimeAsync(20_001);
  await pending;
});

it('ortak liste bağlantı ve yük sınıflarını kapsar', () => {
  expect(isTransientCode('08001')).toBe(true);
  expect(isTransientCode('53200')).toBe(true);
  expect(isTransientCode('23514')).toBe(false);
});
