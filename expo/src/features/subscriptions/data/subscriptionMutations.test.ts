import { changeSubscriptionStatus, confirmOverdueRenewal } from './subscriptionMutations';

const mockResolveRows = jest.fn();
const mockSubmitOperation = jest.fn();
const mockRecordPayment = jest.fn();
const mockRpc = jest.fn();

jest.mock('../../../core/config/env', () => ({ env: { atomicRenewalEnabled: false } }));
jest.mock('../../../core/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

jest.mock('./subscriptionSync', () => ({
  resolveRows: (...args: unknown[]) => mockResolveRows(...args),
  submitOperation: (...args: unknown[]) => mockSubmitOperation(...args),
}));
jest.mock('../../stats/data/paymentRepository', () => ({
  recordPayment: (...args: unknown[]) => mockRecordPayment(...args),
}));
jest.mock('./subscriptionWriteRepository', () => ({
  SubscriptionWriteError: class SubscriptionWriteError extends Error {},
}));

const subscriptionRow = {
  id: 'subscription-1',
  name: 'Video Plus',
  amount: '49.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-10-09',
  next_renewal_date: '2026-10-09',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
};

describe('confirmOverdueRenewal', () => {
  beforeEach(() => {
    mockResolveRows.mockReset().mockResolvedValue([subscriptionRow]);
    mockSubmitOperation.mockReset().mockResolvedValue({ status: 'sent', eventSaved: true });
    mockRecordPayment.mockReset().mockResolvedValue(undefined);
    mockRpc.mockReset().mockResolvedValue({ data: {}, error: null });
    (jest.requireMock('../../../core/config/env') as { env: { atomicRenewalEnabled: boolean } }).env.atomicRenewalEnabled = false;
  });

  it('ödeme kaydını aynı idempotency anahtarıyla yazar ve sonra sonraki yenilemeyi günceller', async () => {
    const result = await confirmOverdueRenewal({
      userId: 'user-1',
      subscriptionId: 'subscription-1',
      today: { year: 2026, month: 10, day: 9 },
      idempotencyKey: 'renewal-operation-123',
    });

    expect(mockRecordPayment).toHaveBeenCalledWith({
      idempotencyKey: 'renewal-operation-123',
      subscriptionId: 'subscription-1',
      amount: '49.90',
      currency: 'TRY',
      paidAt: expect.any(Date),
    });
    expect(mockSubmitOperation).toHaveBeenCalledWith('user-1', expect.objectContaining({
      kind: 'update',
      payload: expect.objectContaining({
        p_subscription_id: 'subscription-1',
        p_next_renewal_date: '2026-11-09',
        p_idempotency_key: 'renewal-operation-123',
      }),
      event: {
        eventType: 'RENEWAL_ADVANCED',
        payload: { from_date: '2026-10-09', to_date: '2026-11-09' },
      },
      savings: null,
    }));
    expect(mockRecordPayment.mock.invocationCallOrder[0]).toBeLessThan(
      mockSubmitOperation.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({ status: 'sent', eventSaved: true });
  });

  it('ödeme kaydı başarısızsa abonelik yenilemesini ilerletmez', async () => {
    mockRecordPayment.mockRejectedValue(new Error('payment write failed'));

    await expect(confirmOverdueRenewal({
      userId: 'user-1',
      subscriptionId: 'subscription-1',
      today: { year: 2026, month: 10, day: 9 },
      idempotencyKey: 'renewal-operation-123',
    })).rejects.toThrow('payment write failed');

    expect(mockSubmitOperation).not.toHaveBeenCalled();
  });

  it('özellik açıldığında tek sunucu işlemini çağırır ve eski yazımları kullanmaz', async () => {
    (jest.requireMock('../../../core/config/env') as { env: { atomicRenewalEnabled: boolean } }).env.atomicRenewalEnabled = true;
    await expect(confirmOverdueRenewal({
      userId: 'user-1', subscriptionId: 'subscription-1',
      today: { year: 2026, month: 10, day: 9 }, idempotencyKey: 'renewal-operation-123',
    })).resolves.toEqual({ status: 'sent', eventSaved: true });
    expect(mockRpc).toHaveBeenCalledWith('confirm_subscription_renewal_idempotent', {
      p_idempotency_key: 'renewal-operation-123',
      p_subscription_id: 'subscription-1',
      p_expected_old_date: '2026-10-09',
      p_next_date: '2026-11-09',
      p_today: '2026-10-09',
    });
    expect(mockRecordPayment).not.toHaveBeenCalled();
    expect(mockSubmitOperation).not.toHaveBeenCalled();
  });
});

it('iptalden yeniden etkinleştirme geçmiş tasarrufu değiştirmez ve yeni tasarruf üretmez', async () => {
  mockResolveRows.mockResolvedValue([{ ...subscriptionRow, status: 'cancelled' }]);
  mockSubmitOperation.mockResolvedValue({ status: 'sent', eventSaved: true });
  await changeSubscriptionStatus({ userId: 'user-1', subscriptionId: 'subscription-1', to: 'active', idempotencyKey: 'reactivate-123' });
  expect(mockSubmitOperation).toHaveBeenCalledWith('user-1', expect.objectContaining({
    savings: null,
    event: { eventType: 'STATUS_CHANGED', payload: { from_status: 'cancelled', to_status: 'active' } },
  }));
});
