import { costPreview } from './subscriptionForm';

describe('costPreview', () => {
  const base = { currency: 'TRY' } as const;

  it('aylık tutarın yıllığını ×12 hesaplar', () => {
    const preview = costPreview({ ...base, amount: '761,12', billingCycle: 'monthly' });
    expect(preview?.monthly.decimalString).toBe('761.12');
    expect(preview?.annual.decimalString).toBe('9133.44');
  });

  it('yıllık tutarın aylığını böler, yıllığı aynı bırakır', () => {
    const preview = costPreview({ ...base, amount: '100', billingCycle: 'yearly' });
    expect(preview?.annual.decimalString).toBe('100.00');
    expect(preview?.monthly.decimalString).toBe('8.33');
  });

  it('haftalık ×52 ve üç aylık ×4 yıllık eşdeğer verir', () => {
    expect(costPreview({ ...base, amount: '10', billingCycle: 'weekly' })?.annual.decimalString).toBe('520.00');
    expect(costPreview({ ...base, amount: '30', billingCycle: 'quarterly' })?.annual.decimalString).toBe('120.00');
  });

  it('geçersiz, sıfır ve aşırı büyük tutarda null döner', () => {
    expect(costPreview({ ...base, amount: '', billingCycle: 'monthly' })).toBeNull();
    expect(costPreview({ ...base, amount: 'abc', billingCycle: 'monthly' })).toBeNull();
    expect(costPreview({ ...base, amount: '0', billingCycle: 'monthly' })).toBeNull();
    expect(costPreview({ ...base, amount: '-5', billingCycle: 'monthly' })).toBeNull();
    expect(costPreview({ ...base, amount: '99999999999', billingCycle: 'monthly' })).toBeNull();
  });
});
