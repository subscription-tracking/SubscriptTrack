import { percentShares } from './percentShares';

describe('percentShares', () => {
  it('toplamı tam 100 yapar (eşit üç pay)', () => {
    const shares = percentShares([1, 1, 1], 3);
    expect(shares).toEqual([34, 33, 33]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('yedi eşit payda da toplam 100 kalır', () => {
    const shares = percentShares([1, 1, 1, 1, 1, 1, 1], 7);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });

  it('tek kategori %100 alır', () => {
    expect(percentShares([500], 500)).toEqual([100]);
  });

  it('toplam sıfırsa hepsi 0', () => {
    expect(percentShares([0, 0], 0)).toEqual([0, 0]);
  });

  it('büyük kesir alan öğeye kalan puanı verir', () => {
    const shares = percentShares([60, 30, 10], 100);
    expect(shares).toEqual([60, 30, 10]);
  });
});
