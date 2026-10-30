import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { upcomingByDay } from './homeSummary';
import { stripDays, weekTotals } from './weekSummary';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'id',
  name: 'Ad',
  amount: '10',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});
const sub = (overrides: Partial<SubscriptionRow>) => subscriptionFromRow(row(overrides));
const today = civilDate(2026, 10, 13);

describe('weekTotals', () => {
  it('ilk 7 günü para birimi başına toplar ve tercih edileni başa koyar', () => {
    const days = upcomingByDay([
      sub({ id: 'a', amount: '10', next_renewal_date: '2026-10-14' }),
      sub({ id: 'b', amount: '5', currency: 'USD', next_renewal_date: '2026-10-15' }),
      sub({ id: 'c', amount: '99', next_renewal_date: '2026-10-25' }),
    ], today, 30);
    const totals = weekTotals(days, 'TRY');
    expect(totals.map((item) => item.currency)).toEqual(['TRY', 'USD']);
    expect(totals[0].total.minorUnits).toBe(1000);
    expect(totals[1].total.minorUnits).toBe(500);
  });

  it('ödeme yokken tercih edilen para biriminde sıfır döner', () => {
    expect(weekTotals([], 'TRY')).toEqual([{ currency: 'TRY', total: expect.objectContaining({ minorUnits: 0 }) }]);
  });
});

describe('stripDays', () => {
  it('gün sayısı kadar eleman üretir; ödeme sayısı para biriminden bağımsızdır', () => {
    const days = upcomingByDay([
      sub({ id: 'a', amount: '10', next_renewal_date: '2026-10-14' }),
      sub({ id: 'b', amount: '5', currency: 'USD', next_renewal_date: '2026-10-15' }),
      sub({ id: 'c', amount: '7', currency: 'EUR', next_renewal_date: '2026-10-15' }),
    ], today, 30);
    const strip = stripDays(days);
    expect(strip).toHaveLength(30);
    expect(strip[0]).toEqual({ count: 0 });
    expect(strip[1]).toEqual({ count: 1 });
    expect(strip[2]).toEqual({ count: 2 });
  });
});
