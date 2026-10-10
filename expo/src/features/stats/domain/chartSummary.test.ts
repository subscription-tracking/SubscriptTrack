import { categorySummary, trendSummary } from './chartSummary';

describe('trendSummary', () => {
  it('dönem, toplam ve en yüksek ayı tek cümlede verir', () => {
    expect(trendSummary({ periodLabel: 'Son 6 ay', totalText: '2.340 ₺', peakMonth: 'Ekim' })).toBe(
      'Son 6 ay, toplam 2.340 ₺, en yüksek Ekim',
    );
  });

  it('en yüksek ay yoksa onu atlar', () => {
    expect(trendSummary({ periodLabel: 'Son 3 ay', totalText: '0 ₺', peakMonth: null })).toBe('Son 3 ay, toplam 0 ₺');
  });
});

describe('categorySummary', () => {
  it('kategori yoksa açıkça söyler', () => {
    expect(categorySummary({ count: 0, totalText: '0 ₺', topName: null, topPercent: 0 })).toBe('Kategori yok');
  });

  it('en büyük kategoriyi yüzdesiyle verir', () => {
    expect(categorySummary({ count: 3, totalText: '1.200 ₺', topName: 'Eğlence', topPercent: 60 })).toBe(
      '3 kategori, toplam 1.200 ₺, en büyük Eğlence %60',
    );
  });

  it('tek kategoride de özet üretir', () => {
    expect(categorySummary({ count: 1, totalText: '99 ₺', topName: 'Müzik', topPercent: 100 })).toBe(
      '1 kategori, toplam 99 ₺, en büyük Müzik %100',
    );
  });
});
