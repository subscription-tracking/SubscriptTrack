import { Money } from '../../../core/domain/money';
import { civilDate, formatCivilDate } from '../../../core/time/calendar';
import { toSubscriptionFields, type SubscriptionFormValues } from './subscriptionForm';
import {
  formValuesFromSubscription,
  priceChangeEvent,
  statusAfterEdit,
  statusChangeEvent,
  subscriptionUpdateFields,
  toUpdatePayload,
} from './subscriptionEdit';
import { type Subscription, type SubscriptionRow, subscriptionFromRow } from './subscription';

const row = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'sub-1',
  name: 'Spotify',
  amount: '59.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'music',
  status: 'active',
  start_date: '2026-01-10',
  next_renewal_date: '2026-10-10',
  payment_method: 'Kart ****',
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  notification_rules: [{ enabled: true, daysBefore: 5 }],
  ...overrides,
});

const subscription = (overrides: Partial<SubscriptionRow> = {}): Subscription => subscriptionFromRow(row(overrides));

const today = civilDate(2026, 10, 9);

describe('formValuesFromSubscription', () => {
  it('kayıtlı alanları form değerlerine taşır ve deneme alanlarını ayırır', () => {
    const values = formValuesFromSubscription(
      subscription({ trial_end_date: '2026-10-20', trial_price_after: '99.00' }),
      today,
    );
    expect(values.name).toBe('Spotify');
    expect(values.amount).toBe('59.90');
    expect(values.isTrial).toBe(true);
    expect(values.trialEndDate).toEqual(civilDate(2026, 10, 20));
    expect(values.trialPrice).toBe('99.00');
  });

  it('başlangıç tarihi yoksa bugünü kullanır; deneme yoksa isTrial false', () => {
    const values = formValuesFromSubscription(subscription({ start_date: null }), today);
    expect(values.startDate).toEqual(today);
    expect(values.isTrial).toBe(false);
  });

  it('listede olmayan para birimini değiştirmeden taşır', () => {
    const values = formValuesFromSubscription(subscription({ currency: 'JPY' }), today);
    expect(values.currency).toBe('JPY');
  });
});

describe('toUpdatePayload', () => {
  it('bildirim kurallarını olduğu gibi geri gönderir (RPC null için sıfırlar)', () => {
    const current = subscription();
    const payload = toUpdatePayload(current, subscriptionUpdateFields(current), 'active', 'key-12345678');
    expect(payload.p_notification_rules).toEqual([{ enabled: true, daysBefore: 5 }]);
    expect(payload.p_subscription_id).toBe('sub-1');
    expect(payload.p_status).toBe('active');
    expect(payload.p_idempotency_key).toBe('key-12345678');
  });

  it('düzenleme formu alanlarını ve mevcut durumu birlikte yazar', () => {
    const current = subscription({ status: 'paused' });
    const values: SubscriptionFormValues = { ...formValuesFromSubscription(current, today), name: 'Spotify Premium' };
    const payload = toUpdatePayload(current, toSubscriptionFields(values), current.status, 'key-12345678');
    expect(payload.p_name).toBe('Spotify Premium');
    expect(payload.p_status).toBe('paused');
    expect(payload.p_amount).toBe('59.90');
  });

  it('boş tarihleri null bırakır (durum değişikliği doğrulama yapmaz)', () => {
    const fields = subscriptionUpdateFields(subscription({ start_date: null, next_renewal_date: null }));
    expect(fields.p_start_date).toBeNull();
    expect(fields.p_next_renewal_date).toBeNull();
  });

  it('yenileme tarihini ISO gün biçiminde gönderir', () => {
    expect(subscriptionUpdateFields(subscription()).p_next_renewal_date).toBe(formatCivilDate(civilDate(2026, 10, 10)));
  });
});

describe('priceChangeEvent', () => {
  it('tutar ve para birimi aynıysa olay üretmez', () => {
    expect(priceChangeEvent(subscription(), { amount: Money.parse('59.90'), currency: 'TRY' })).toBeNull();
  });

  it('tutar değişince PRICE_CHANGED üretir ve eski/yeni değeri taşır', () => {
    const event = priceChangeEvent(subscription(), { amount: Money.parse('69.90'), currency: 'TRY' });
    expect(event).toEqual({
      eventType: 'PRICE_CHANGED',
      payload: {
        from_amount: '59.90',
        from_currency: 'TRY',
        to_amount: '69.90',
        to_currency: 'TRY',
      },
    });
  });

  it('yalnızca para birimi değişse de olay üretir', () => {
    const event = priceChangeEvent(subscription(), { amount: Money.parse('59.90'), currency: 'USD' });
    expect(event?.eventType).toBe('PRICE_CHANGED');
  });
});

describe('statusChangeEvent', () => {
  it('durum değişmediyse olay yoktur', () => {
    expect(statusChangeEvent('active', 'active')).toBeNull();
  });

  it('geçişi from/to olarak kaydeder', () => {
    expect(statusChangeEvent('active', 'paused')).toEqual({
      eventType: 'STATUS_CHANGED',
      payload: { from_status: 'active', to_status: 'paused' },
    });
  });
});

describe('statusAfterEdit', () => {
  const end = civilDate(2026, 11, 1);
  it('aktif kayda deneme eklenince trial olur', () => expect(statusAfterEdit('active', true, end)).toBe('trial'));
  it('deneme tarihi yoksa aktif kalır', () => expect(statusAfterEdit('active', true, null)).toBe('active'));
  it('deneme kapanınca trial aktif olur', () => expect(statusAfterEdit('trial', false, null)).toBe('active'));
  it('trial ve deneme sürüyorsa değişmez', () => expect(statusAfterEdit('trial', true, end)).toBe('trial'));
  it.each(['paused', 'cancelled', 'expired', 'archived'] as const)('%s durumuna dokunmaz', (status) => {
    expect(statusAfterEdit(status, true, end)).toBe(status);
    expect(statusAfterEdit(status, false, null)).toBe(status);
  });
});
