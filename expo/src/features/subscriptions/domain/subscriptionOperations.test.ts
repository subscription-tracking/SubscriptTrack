import { type CreateSubscriptionPayload } from './subscriptionForm';
import { type UpdatePayload } from './subscriptionEdit';
import {
  PENDING_PREFIX,
  applyOperation,
  overlayPendingOperations,
  pendingCreateId,
  rowFromCreate,
  type SubscriptionOperation,
} from './subscriptionOperations';
import { type SubscriptionRow, subscriptionFromRow } from './subscription';

const serverRow = (id: string, overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id,
  name: 'Spotify',
  amount: '59.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'music',
  status: 'active',
  start_date: null,
  next_renewal_date: '2026-10-25',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  is_archived: false,
  notification_rules: [{ enabled: true, daysBefore: 5 }],
  ...overrides,
});

const createPayload: CreateSubscriptionPayload = {
  p_idempotency_key: 'create-key-1234',
  p_name: 'Canva',
  p_amount: '99.00',
  p_currency: 'TRY',
  p_billing_cycle: 'yearly',
  p_start_date: '2026-10-01',
  p_next_renewal_date: '2027-10-01',
  p_category: 'software',
  p_notes: null,
  p_payment_method: null,
  p_trial_end_date: null,
  p_trial_price_after: null,
};

const updateOp = (id: string, overrides: Partial<UpdatePayload> = {}): SubscriptionOperation => ({
  kind: 'update',
  event: null,
  savings: null,
  payload: {
    p_idempotency_key: `update-${id}-12345678`,
    p_subscription_id: id,
    p_name: 'Spotify Premium',
    p_amount: '69.90',
    p_currency: 'TRY',
    p_billing_cycle: 'monthly',
    p_start_date: null,
    p_next_renewal_date: '2026-10-25',
    p_category: 'music',
    p_notes: null,
    p_payment_method: null,
    p_trial_end_date: null,
    p_trial_price_after: null,
    p_notification_rules: [{ enabled: true, daysBefore: 5 }],
    p_status: 'active',
    ...overrides,
  },
});

describe('rowFromCreate', () => {
  it('geçici kimlik öneki taşır ve deneme varsa durum trial olur', () => {
    const row = rowFromCreate(createPayload);
    expect(row.id).toBe(`${PENDING_PREFIX}create-key-1234`);
    expect(row.id).toBe(pendingCreateId(createPayload));
    expect(row.status).toBe('active');
    expect(rowFromCreate({ ...createPayload, p_trial_end_date: '2026-11-01' }).status).toBe('trial');
  });
});

describe('applyOperation', () => {
  it('güncelleme yalnızca hedef satırı değiştirir ve arşivi kaldırır', () => {
    const rows = [serverRow('a', { is_archived: true, status: 'archived' }), serverRow('b')];
    const next = applyOperation(rows, updateOp('a'));
    expect(next[0].name).toBe('Spotify Premium');
    expect(next[0].is_archived).toBe(false);
    expect(next[1]).toEqual(rows[1]);
  });

  it('güncellenen satırın bildirim kuralı işlemle birlikte gelir', () => {
    const next = applyOperation([serverRow('a')], updateOp('a', { p_notification_rules: [{ enabled: false }] }));
    expect(next[0].notification_rules).toEqual([{ enabled: false }]);
  });

  it('girdi dizisini değiştirmez', () => {
    const rows = [serverRow('a')];
    applyOperation(rows, updateOp('a'));
    expect(rows[0].name).toBe('Spotify');
  });

  it('ekleme listenin başına geçici kayıt koyar', () => {
    const next = applyOperation([serverRow('a')], { kind: 'create', payload: createPayload });
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe(pendingCreateId(createPayload));
    expect(subscriptionFromRow(next[0]).name).toBe('Canva');
  });
});

describe('overlayPendingOperations', () => {
  it('bekleyen işlemleri sırayla bindirir: önce ekleme, sonra güncelleme', () => {
    const rows = [serverRow('a')];
    const result = overlayPendingOperations(rows, [
      { kind: 'create', payload: createPayload },
      updateOp('a', { p_status: 'paused' }),
    ]);
    expect(result.map((row) => row.id)).toEqual([pendingCreateId(createPayload), 'a']);
    expect(result[1].status).toBe('paused');
  });

  it('bekleyen işlem yoksa sunucu satırları aynen döner', () => {
    const rows = [serverRow('a')];
    expect(overlayPendingOperations(rows, [])).toEqual(rows);
  });

  it('sunucu satırlarını değiştirmez (cache temiz kalır)', () => {
    const rows = [serverRow('a')];
    overlayPendingOperations(rows, [updateOp('a')]);
    expect(rows[0].name).toBe('Spotify');
  });
});
