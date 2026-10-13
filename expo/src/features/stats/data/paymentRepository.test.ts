import { DataWriteError } from '../../../core/errors/dataWriteError';
import { deletePayment, fetchPayments, recordDeferredPayment, recordPayment, updatePayment } from './paymentRepository';

jest.mock('../../../core/config/env', () => ({ env: { idempotentDeferredEnabled: false } }));
const setDeferredRpc = (enabled: boolean) => {
  (jest.requireMock('../../../core/config/env') as { env: { idempotentDeferredEnabled: boolean } }).env.idempotentDeferredEnabled = enabled;
};

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock('../../../core/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args), rpc: (...args: unknown[]) => mockRpc(...args) },
}));

const paidAt = new Date('2026-10-11T09:00:00.000Z');

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockRpc.mockResolvedValue({ error: null });
});

it('loads ordered payments and maps decimal amounts and deferred status', async () => {
  const range = jest.fn().mockResolvedValue({ data: [{
    id: 'p1', subscription_id: 's1', amount: '49.90', currency: 'TRY', paid_at: paidAt.toISOString(), status: 'DEFERRED',
  }], error: null });
  const secondOrder = jest.fn().mockReturnValue({ range });
  const order = jest.fn().mockReturnValue({ order: secondOrder });
  const select = jest.fn().mockReturnValue({ order });
  mockFrom.mockReturnValue({ select });
  const result = await fetchPayments();
  expect(mockFrom).toHaveBeenCalledWith('payment_events');
  expect(select).toHaveBeenCalledWith('id, subscription_id, amount, currency, paid_at, status');
  expect(order).toHaveBeenCalledWith('paid_at', { ascending: false });
  expect(secondOrder).toHaveBeenCalledWith('id', { ascending: false });
  expect(range).toHaveBeenCalledWith(0, 499);
  expect(result[0]).toMatchObject({ id: 'p1', status: 'DEFERRED' });
  expect(result[0].amount.minorUnits).toBe(4990);
});

it('reports a payment history read failure', async () => {
  mockFrom.mockReturnValue({ select: () => ({ order: () => ({ order: () => ({ range: async () => ({ data: null, error: { code: '42501' } }) }) }) }) });
  await expect(fetchPayments()).rejects.toBeInstanceOf(DataWriteError);
});

it('sends the payment once through the idempotent RPC', async () => {
  await recordPayment({ idempotencyKey: 'key-123456', subscriptionId: 's1', amount: '49.90', currency: 'TRY', paidAt });
  expect(mockRpc).toHaveBeenCalledWith('record_payment_idempotent', {
    p_idempotency_key: 'key-123456', p_subscription_id: 's1', p_amount: '49.90', p_currency: 'TRY',
    p_paid_at: paidAt.toISOString(),
  });
});

it.each([
  ['P0002', 'Abonelik bulunamadı'],
  ['42501', 'Oturumun süresi'],
  [undefined, 'Ödeme kaydedilemedi'],
])('maps an RPC error %s without retrying a known permanent error', async (code, message) => {
  mockRpc.mockResolvedValue({ error: { code } });
  await expect(recordPayment({ idempotencyKey: 'key-123456', subscriptionId: 's1', amount: '49.90', currency: 'TRY', paidAt }))
    .rejects.toMatchObject({ message: expect.stringContaining(message), retryable: !code });
});

it('updates and deletes payment records by id; reports RLS/service failures', async () => {
  const select = jest.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null });
  const eq = jest.fn().mockReturnValue({ select });
  const update = jest.fn().mockReturnValue({ eq });
  const remove = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ update, delete: remove });
  await updatePayment({ id: 'p1', amount: '51.00', paidAt });
  expect(update).toHaveBeenCalledWith({ amount: '51.00', paid_at: paidAt.toISOString() });
  expect(eq).toHaveBeenCalledWith('id', 'p1');
  expect(select).toHaveBeenCalledWith('id');
  await deletePayment('p1');
  expect(remove).toHaveBeenCalledTimes(1);

  select.mockResolvedValue({ data: null, error: { code: '42501' } });
  await expect(updatePayment({ id: 'p1', amount: '51.00', paidAt })).rejects.toMatchObject({ code: '42501', retryable: false });
  await expect(deletePayment('p1')).rejects.toMatchObject({ code: '42501' });

  select.mockResolvedValue({ data: [], error: null });
  await expect(updatePayment({ id: 'other', amount: '51.00', paidAt })).rejects.toThrow('Ödeme kaydı bulunamadı');
  await expect(deletePayment('other')).rejects.toThrow('Ödeme kaydı bulunamadı');
});

const deferredInput = { userId: 'u1', idempotencyKey: 'key-123456', subscriptionId: 's1', amount: '49.90', currency: 'TRY', paidAt, deferredUntil: '2026-11-11' };

it('writes a deferred payment through the idempotent RPC when the flag is on', async () => {
  setDeferredRpc(true);
  await recordDeferredPayment(deferredInput);
  expect(mockRpc).toHaveBeenCalledWith('record_deferred_payment_idempotent', {
    p_idempotency_key: 'key-123456', p_subscription_id: 's1', p_amount: '49.90', p_currency: 'TRY',
    p_paid_at: paidAt.toISOString(), p_deferred_until: '2026-11-11',
  });
  expect(mockFrom).not.toHaveBeenCalled();
  mockRpc.mockResolvedValue({ error: { code: '42501' } });
  await expect(recordDeferredPayment(deferredInput)).rejects.toMatchObject({ code: '42501' });
});

it('keeps the direct DEFERRED insert while the migration is not deployed', async () => {
  setDeferredRpc(false);
  const insert = jest.fn().mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ insert });
  await recordDeferredPayment(deferredInput);
  expect(insert).toHaveBeenCalledWith({
    user_id: 'u1', subscription_id: 's1', amount: '49.90', currency: 'TRY', paid_at: paidAt.toISOString(),
    source: 'manual', status: 'DEFERRED', deferred_until: '2026-11-11',
  });
  expect(mockRpc).not.toHaveBeenCalled();
  insert.mockResolvedValue({ error: { code: '42501' } });
  await expect(recordDeferredPayment(deferredInput)).rejects.toMatchObject({ code: '42501' });
});

it('pages through the full payment history instead of stopping at one page', async () => {
  const row = (i: number) => ({ id: `p${i}`, subscription_id: 's1', amount: '1.00', currency: 'TRY', paid_at: paidAt.toISOString(), status: 'PAID' });
  const firstPage = Array.from({ length: 500 }, (_, i) => row(i));
  const secondPage = [row(500), row(501)];
  const range = jest.fn()
    .mockResolvedValueOnce({ data: firstPage, error: null })
    .mockResolvedValueOnce({ data: secondPage, error: null });
  const order = jest.fn().mockReturnValue({ order: jest.fn().mockReturnValue({ range }) });
  mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ order }) });
  const result = await fetchPayments();
  expect(range.mock.calls).toEqual([[0, 499], [500, 999]]);
  expect(result).toHaveLength(502);
});
