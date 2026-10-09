import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionFormValues, hasErrors, toCreatePayload, validateSubscriptionForm } from './subscriptionForm';

const today = civilDate(2026, 10, 9);

const valid = (overrides: Partial<SubscriptionFormValues> = {}): SubscriptionFormValues => ({
  name: 'Netflix',
  amount: '199,99',
  currency: 'TRY',
  billingCycle: 'monthly',
  category: 'streaming',
  startDate: today,
  nextRenewalDate: civilDate(2026, 11, 9),
  notes: '',
  paymentMethod: '',
  isTrial: false,
  trialEndDate: null,
  trialPrice: '',
  ...overrides,
});

describe('validateSubscriptionForm', () => {
  it('geçerli form hata üretmez', () => {
    expect(hasErrors(validateSubscriptionForm(valid()))).toBe(false);
  });

  it('boş ad ve boş tutar için Flutter metinlerini döner', () => {
    const errors = validateSubscriptionForm(valid({ name: '  ', amount: '' }));
    expect(errors.name).toBe('Ad boş olamaz');
    expect(errors.amount).toBe('Tutar gir');
  });

  it('sıfır, negatif ve bozuk tutarı reddeder', () => {
    expect(validateSubscriptionForm(valid({ amount: '0' })).amount).toBe('Geçerli tutar gir');
    expect(validateSubscriptionForm(valid({ amount: '-5' })).amount).toBe('Geçerli tutar gir');
    expect(validateSubscriptionForm(valid({ amount: 'abc' })).amount).toBe('Geçerli tutar gir');
  });

  it('üç ondalık basamaklı tutarı reddeder (kuruş sınırı)', () => {
    expect(validateSubscriptionForm(valid({ amount: '1.234' })).amount).toBe('Geçerli tutar gir');
  });

  it('deneme açıkken bitiş tarihi ve deneme fiyatı zorunludur', () => {
    const errors = validateSubscriptionForm(valid({ isTrial: true }));
    expect(errors.trialEndDate).toBe('Deneme bitiş tarihini seç');
    expect(errors.trialPrice).toBe('Geçerli bir deneme sonrası fiyatı gir');
  });

  it('deneme kapalıyken deneme alanları istenmez', () => {
    expect(hasErrors(validateSubscriptionForm(valid({ isTrial: false, trialPrice: '' })))).toBe(false);
  });

  it('ad 160 karakteri aşarsa reddedilir', () => {
    expect(validateSubscriptionForm(valid({ name: 'a'.repeat(161) })).name).toContain('160');
  });
});

describe('toCreatePayload', () => {
  it('RPC parametrelerini sözleşmedeki adlarla ve doğru biçimde üretir', () => {
    const payload = toCreatePayload(valid({ notes: '  not  ', paymentMethod: ' Garanti ' }), 'key-1');
    expect(payload).toEqual({
      p_idempotency_key: 'key-1',
      p_name: 'Netflix',
      p_amount: '199.99',
      p_currency: 'TRY',
      p_billing_cycle: 'monthly',
      p_start_date: '2026-10-09',
      p_next_renewal_date: '2026-11-09',
      p_category: 'streaming',
      p_notes: 'not',
      p_payment_method: 'Garanti',
      p_trial_end_date: null,
      p_trial_price_after: null,
    });
  });

  it('boş not ve ödeme yöntemini null gönderir', () => {
    const payload = toCreatePayload(valid({ notes: '   ' }), 'k');
    expect(payload.p_notes).toBeNull();
    expect(payload.p_payment_method).toBeNull();
  });

  it('deneme açıksa deneme alanlarını doldurur', () => {
    const payload = toCreatePayload(
      valid({ isTrial: true, trialEndDate: civilDate(2026, 10, 30), trialPrice: '99' }),
      'k',
    );
    expect(payload.p_trial_end_date).toBe('2026-10-30');
    expect(payload.p_trial_price_after).toBe('99.00');
  });

  it('doğrulanmamış formla yük üretmeyi reddeder', () => {
    expect(() => toCreatePayload(valid({ amount: '' }), 'k')).toThrow(RangeError);
  });
});
