import { DEFAULT_ACTIVE_CURRENCY, isActiveCurrency, resolveActiveCurrency } from './activeCurrency';

describe('resolveActiveCurrency', () => {
  it('profildeki geçerli tercih önceliklidir', () => {
    expect(resolveActiveCurrency('USD', 'EUR')).toBe('USD');
  });

  it('profil yoksa cihazdaki seçim kullanılır', () => {
    expect(resolveActiveCurrency(null, 'EUR')).toBe('EUR');
  });

  it('ikisi de yoksa TRY', () => {
    expect(resolveActiveCurrency(null, null)).toBe(DEFAULT_ACTIVE_CURRENCY);
    expect(DEFAULT_ACTIVE_CURRENCY).toBe('TRY');
  });

  it('desteklenmeyen (eski GBP) değer yok sayılır', () => {
    expect(resolveActiveCurrency('GBP', null)).toBe('TRY');
    expect(resolveActiveCurrency('GBP', 'USD')).toBe('USD');
  });
});

describe('isActiveCurrency', () => {
  it('yalnızca üç desteklenen kodu kabul eder', () => {
    expect(isActiveCurrency('TRY')).toBe(true);
    expect(isActiveCurrency('USD')).toBe(true);
    expect(isActiveCurrency('EUR')).toBe(true);
    expect(isActiveCurrency('GBP')).toBe(false);
    expect(isActiveCurrency(undefined)).toBe(false);
  });
});
