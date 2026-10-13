import { UnsupportedStoredDataError, decodeCache, decodeQueue } from './storedSubscriptions';
import { rowFromCreate } from './subscriptionOperations';

const payload = { p_idempotency_key: 'key', p_name: 'Plan', p_amount: '10.00', p_currency: 'TRY', p_billing_cycle: 'monthly',
  p_category: 'software', p_start_date: '2026-10-01', p_next_renewal_date: '2026-11-01', p_notes: null,
  p_payment_method: null, p_trial_end_date: null, p_trial_price_after: null } as const;
const entry = { id: 'key', userId: 'user', createdAt: '2026-10-12T12:00:00Z', stage: 'write', op: { kind: 'create', payload } };

it('reads legacy and versioned queues without changing operations', () => {
  expect(decodeQueue([entry], 'user')).toEqual([entry]);
  expect(decodeQueue({ version: 1, entries: [entry] }, 'user')).toEqual([entry]);
});
it.each([[{}], [{ ...entry, userId: 'other' }], [{ ...entry, stage: 'unknown' }], [{ ...entry, id: 'different' }]])('rejects malformed or wrong-account queues', (value) => {
  expect(() => decodeQueue([value], 'user')).toThrow();
});
it('rejects unknown versions and malformed cache rows', () => {
  expect(() => decodeQueue({ version: 3, entries: [] }, 'user')).toThrow();
  expect(() => decodeCache([{}])).toThrow();
  expect(decodeCache([rowFromCreate(payload)])).toHaveLength(1);
});

it.each(['abc', '-1.00', '0.001', '1000000000.01', '9007199254740992'])('rejects invalid or out-of-contract subscription amount %s', (amount) => {
  expect(() => decodeCache([{ ...rowFromCreate(payload), amount }])).toThrow();
  expect(() => decodeQueue([{ ...entry, op: { kind: 'create', payload: { ...payload, p_amount: amount } } }], 'user')).toThrow();
});

it.each([
  { next_renewal_date: '2026-02-30' }, { start_date: '2026-13-01' }, { trial_end_date: 'not-a-date' },
  { currency: 'invalid' }, { billing_cycle: 'sometimes' }, { category: 'invalid' }, { status: 'invalid' },
  { trial_price_after: 'abc' },
])('rejects invalid cached dates, enums and trial amounts: %j', (patch) => {
  expect(() => decodeCache([{ ...rowFromCreate(payload), ...patch }])).toThrow();
});

it('preserves legacy numeric amounts, valid foreign currency, zero and the API maximum', () => {
  for (const amount of [49.9, '0.00', '1000000000.00']) {
    const row = { ...rowFromCreate(payload), amount, currency: 'EUR', next_renewal_date: '2028-02-29' };
    expect(decodeCache([row])).toEqual([row]);
  }
});

it('rejects invalid queued update dates and savings money without changing the entry', () => {
  const invalid = { ...entry, op: { kind: 'update', payload: { ...payload, p_subscription_id: 'sub', p_status: 'paused', p_notification_rules: [], p_next_renewal_date: '2026-02-30' }, event: null, savings: null } };
  expect(() => decodeQueue([invalid], 'user')).toThrow();
  expect(invalid.op.payload.p_next_renewal_date).toBe('2026-02-30');
  const invalidSavings = { ...invalid, op: { ...invalid.op, payload: { ...invalid.op.payload, p_next_renewal_date: '2026-11-01' }, savings: { eventType: 'PAUSED', monthlyAmount: 'abc', annualAmount: '120.00', currency: 'TRY' } } };
  expect(() => decodeQueue([invalidSavings], 'user')).toThrow();
});

it('gelecek sürümü ham değeri taşıyan UnsupportedStoredDataError ile bildirir; sürüm 1 ve 2 çalışır', () => {
  const future = { version: 3, entries: [entry] };
  try { decodeQueue(future, 'user'); throw new Error('fırlamalıydı'); } catch (error) {
    expect(error).toBeInstanceOf(UnsupportedStoredDataError);
    expect((error as UnsupportedStoredDataError).raw).toBe(future);
  }
  expect(() => decodeCache(future)).toThrow(UnsupportedStoredDataError);
  expect(decodeQueue({ version: 2, entries: [entry] }, 'user')).toEqual([entry]);
});
