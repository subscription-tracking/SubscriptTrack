import { civilDate } from '../../../core/time/calendar';
import { localCivilDate, paidAtFromCivil, parsePaymentAmount } from './paymentEvents';

describe('parsePaymentAmount', () => {
  it('pozitif tutarı kabul eder', () => {
    expect(parsePaymentAmount('149,99')?.decimalString).toBe('149.99');
  });

  it('sıfır, negatif ve geçersiz girdiyi reddeder', () => {
    expect(parsePaymentAmount('0')).toBeNull();
    expect(parsePaymentAmount('-5')).toBeNull();
    expect(parsePaymentAmount('abc')).toBeNull();
    expect(parsePaymentAmount('')).toBeNull();
  });
});

describe('paidAtFromCivil ve localCivilDate', () => {
  it('seçilen günü öğlen olarak kaydeder ve aynı yerel güne geri döner', () => {
    const day = civilDate(2026, 10, 31);
    const stored = paidAtFromCivil(day).toISOString();
    expect(localCivilDate(stored)).toEqual(day);
  });

  it('ay sonu ve artık gün kayıpsız gider', () => {
    const leap = civilDate(2028, 2, 29);
    expect(localCivilDate(paidAtFromCivil(leap).toISOString())).toEqual(leap);
  });
});
