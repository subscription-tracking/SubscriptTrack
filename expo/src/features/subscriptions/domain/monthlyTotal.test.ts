import { type SubscriptionRow, subscriptionFromRow } from './subscription';
import { activeMonthlyTotals, rowPosition } from './monthlyTotal';

const sub = (overrides: Partial<SubscriptionRow>) => subscriptionFromRow({
  id: 'id', name: 'Ad', amount: '10', currency: 'TRY', billing_cycle: 'monthly', category: 'other', status: 'active',
  start_date: '2026-01-01', next_renewal_date: '2026-10-15', payment_method: null, notes: null, website: null,
  trial_end_date: null, trial_price_after: null, ...overrides,
});

describe('activeMonthlyTotals', () => {
  it('para birimi başına toplar, ürün sırasına dizer ve aktif olmayanları saymaz', () => {
    const totals = activeMonthlyTotals([
      sub({ id: 'a', amount: '10' }),
      sub({ id: 'b', amount: '120', billing_cycle: 'yearly', currency: 'EUR' }),
      sub({ id: 'c', amount: '5', currency: 'USD' }),
      sub({ id: 'd', amount: '99', status: 'paused' }),
    ]);
    expect(totals.map((item) => item.currency)).toEqual(['TRY', 'USD', 'EUR']);
    expect(totals.map((item) => item.total.minorUnits)).toEqual([1000, 500, 1000]);
  });

  it('aktif kayıt yoksa boş döner', () => {
    expect(activeMonthlyTotals([])).toEqual([]);
  });
});

describe('rowPosition', () => {
  it('grubun ilk, orta ve son satırını bölüm başlıklarına göre ayırır', () => {
    const rows = [{ kind: 'header' }, { kind: 'item' }, { kind: 'item' }, { kind: 'item' }, { kind: 'header' }, { kind: 'item' }];
    expect([1, 2, 3, 5].map((index) => rowPosition(rows, index))).toEqual(['first', 'middle', 'last', 'single']);
  });
});
