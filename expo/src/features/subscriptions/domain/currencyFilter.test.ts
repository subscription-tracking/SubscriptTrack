import { hiddenCount, inCurrency } from './currencyFilter';

const items = [
  { id: 'a', currency: 'TRY' },
  { id: 'b', currency: 'USD' },
  { id: 'c', currency: 'TRY' },
  { id: 'd', currency: 'GBP' },
];

describe('inCurrency', () => {
  it('yalnızca seçili para birimindeki kayıtları döner', () => {
    expect(inCurrency(items, 'TRY').map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('eşleşme yoksa boş liste', () => {
    expect(inCurrency(items, 'EUR')).toEqual([]);
  });
});

describe('hiddenCount', () => {
  it('gizlenen kayıt sayısını verir', () => {
    expect(hiddenCount(items, 'TRY')).toBe(2);
  });

  it('hepsi aynı para birimindeyse sıfır', () => {
    expect(hiddenCount([{ currency: 'TRY' }], 'TRY')).toBe(0);
  });
});
