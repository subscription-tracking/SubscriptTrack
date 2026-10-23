import { loadQueue, runSync, submitOperation } from './subscriptionSync';
import { DataWriteError } from '../../../core/errors/dataWriteError';
import { type SubscriptionOperation } from '../domain/subscriptionOperations';
import { type UpdatePayload } from '../domain/subscriptionEdit';
import { type QueueEntry, type QueueStage } from '../domain/mutationQueue';
import { supabase } from '../../../core/supabase/client';
import { readJsonStrict, writeJson } from '../../../core/storage/secureJsonStore';
import { getNetworkStateAsync } from 'expo-network';
import { createSubscription, recordSubscriptionEvent, updateSubscription } from './subscriptionWriteRepository';
import { insertSavings } from '../../savings/data/savingsRepository';
jest.mock('./subscriptionDeleteRepository', () => ({ softDeleteSubscriptions: jest.fn() }));
jest.mock('../../../core/config/env', () => ({ env: { softDeletionEnabled: false } }));

jest.mock('../../../core/supabase/client', () => ({
  supabase: { auth: { getSession: jest.fn() }, rpc: jest.fn(), from: jest.fn() },
}));
jest.mock('../../../core/storage/secureJsonStore', () => ({ readJsonStrict: jest.fn(), writeJson: jest.fn() }));
jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock('./subscriptionRepository', () => ({ fetchSubscriptionRows: jest.fn() }));
jest.mock('./subscriptionWriteRepository', () => ({
  createSubscription: jest.fn(), updateSubscription: jest.fn(), recordSubscriptionEvent: jest.fn(),
}));
jest.mock('../../savings/data/savingsRepository', () => ({ insertSavings: jest.fn() }));

const getSession = jest.mocked(supabase.auth.getSession);
const read = jest.mocked(readJsonStrict);
const write = jest.mocked(writeJson);
const createWrite = jest.mocked(createSubscription);
const updateWrite = jest.mocked(updateSubscription);
const recordEvent = jest.mocked(recordSubscriptionEvent);
const insertSaving = jest.mocked(insertSavings);

function session(userId: string) {
  return { data: { session: { user: { id: userId } } }, error: null };
}

function create(id: string): SubscriptionOperation {
  return {
    kind: 'create',
    payload: {
      p_idempotency_key: `create-${id}-123456`, p_name: `Plan ${id}`, p_amount: '10.00', p_currency: 'TRY',
      p_billing_cycle: 'monthly', p_start_date: '2026-10-01', p_next_renewal_date: '2026-11-01',
      p_category: 'software', p_notes: null, p_payment_method: null, p_trial_end_date: null, p_trial_price_after: null,
    },
  };
}

function update(id: string): SubscriptionOperation {
  const payload: UpdatePayload = {
    p_idempotency_key: `update-${id}-123456`, p_subscription_id: id, p_name: 'Plan', p_amount: '10.00',
    p_currency: 'TRY', p_billing_cycle: 'monthly', p_start_date: '2026-10-01', p_next_renewal_date: '2026-11-01',
    p_category: 'software', p_notes: null, p_payment_method: null, p_trial_end_date: null, p_trial_price_after: null,
    p_notification_rules: [], p_status: 'paused',
  };
  return {
    kind: 'update', payload,
    event: { eventType: 'STATUS_CHANGED', payload: { from_status: 'active', to_status: 'paused' } }, savings: null,
  };
}

function entry(userId: string, id: string, op: SubscriptionOperation, stage: QueueStage = 'write'): QueueEntry {
  return { id, userId, createdAt: '2026-10-11T10:00:00.000Z', stage, op };
}

beforeEach(() => {
  jest.clearAllMocks();
  let storedQueue: unknown = null;
  read.mockImplementation(async (key) => key.startsWith('subscriptions.queue.') ? storedQueue : null);
  write.mockImplementation(async (_key, value) => { storedQueue = value; });
  getSession.mockResolvedValue(session('user-1') as never);
  jest.mocked(getNetworkStateAsync).mockResolvedValue({ isConnected: true, isInternetReachable: true } as never);
  createWrite.mockResolvedValue('created-id');
  updateWrite.mockResolvedValue(undefined);
  recordEvent.mockResolvedValue(undefined);
  jest.mocked(insertSaving).mockResolvedValue(undefined);
});

describe('subscription synchronization', () => {
  it('preserves malformed queue data without writing or sending it', async () => {
    read.mockResolvedValue([{}]);
    await expect(runSync('user-1')).rejects.toThrow('Bekleyen işlemler');
    expect(write).not.toHaveBeenCalled();
    expect(createWrite).not.toHaveBeenCalled();
  });

  it('does not treat a storage read failure as an empty queue', async () => {
    read.mockRejectedValue(new Error('keystore unavailable'));
    await expect(loadQueue('user-1')).rejects.toThrow('keystore unavailable');
    expect(write).not.toHaveBeenCalled();
  });

  it('keeps a transient event failure queued and retries that stage without repeating the update', async () => {
    recordEvent
      .mockRejectedValueOnce(new DataWriteError('temporary network error', { retryable: true }))
      .mockResolvedValueOnce(undefined);

    const first = await submitOperation('user-1', update('subscription-1'));
    expect(first).toMatchObject({ status: 'queued', eventSaved: false });
    expect(updateWrite).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('subscriptions.queue.user-1', { version: 1, entries: [expect.objectContaining({ stage: 'event' })] });

    const second = await runSync('user-1');
    expect(second.pending).toBe(0);
    expect(updateWrite).toHaveBeenCalledTimes(1);
    expect(recordEvent).toHaveBeenCalledTimes(2);
  });

  it('stops an old account queue when the signed-in user changes, leaving later writes untouched', async () => {
    const first = create('first');
    const second = create('second');
    let storedQueue: unknown = [entry('user-1', first.payload.p_idempotency_key, first), entry('user-1', second.payload.p_idempotency_key, second)];
    read.mockImplementation(async () => storedQueue);
    write.mockImplementation(async (_key, value) => { storedQueue = value; });
    getSession.mockResolvedValueOnce(session('user-1') as never).mockResolvedValueOnce(session('user-2') as never);

    const report = await runSync('user-1');
    expect(getSession).toHaveBeenCalledTimes(2);
    expect(createWrite).toHaveBeenCalledTimes(1);
    expect(report.pending).toBe(1);
    expect(storedQueue).toEqual({ version: 1, entries: [entry('user-1', second.payload.p_idempotency_key, second)] });
  });
});
