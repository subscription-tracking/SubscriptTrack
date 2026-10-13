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
    const stored = paidAtFromCivil(day, 'Europe/Istanbul').toISOString();
    expect(localCivilDate(stored, 'Europe/Istanbul')).toEqual(day);
  });

  it('ay sonu ve artık gün kayıpsız gider', () => {
    const leap = civilDate(2028, 2, 29);
    expect(localCivilDate(paidAtFromCivil(leap, 'Europe/Istanbul').toISOString(), 'Europe/Istanbul')).toEqual(leap);
  });
});

describe('profil saat diliminde ödeme tarihi', () => {
  const day = civilDate(2026, 10, 1);

  it('aynı anı profildeki bölgeye göre farklı aylara ayırır', () => {
    expect(localCivilDate('2026-10-01T00:30:00.000Z', 'America/New_York')).toEqual(civilDate(2026, 9, 30));
    expect(localCivilDate('2026-10-01T00:30:00.000Z', 'Europe/Istanbul')).toEqual(day);
  });

  it('seçilen günü profil bölgesinde öğle olarak kaydeder', () => {
    expect(paidAtFromCivil(day, 'Europe/Istanbul').toISOString()).toBe('2026-10-01T09:00:00.000Z');
    expect(paidAtFromCivil(day, 'America/New_York').toISOString()).toBe('2026-10-01T16:00:00.000Z');
  });
});
