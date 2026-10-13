import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import {
  activeForTotals,
  isNotStarted,
  monthlyTotalsByCurrency,
  nextPayment,
  renewingWithin,
  trialsByEnd,
  yearlyTotalsByCurrency,
} from './dashboardSummary';

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
const today = civilDate(2026, 10, 9);

describe('isNotStarted', () => {
  it('başlangıç günü gelmemiş aktif kayıt henüz başlamamıştır', () => {
    expect(isNotStarted(sub({ start_date: '2026-11-01' }), today)).toBe(true);
    expect(isNotStarted(sub({ start_date: '2026-10-09' }), today)).toBe(false);
  });

  it('duraklatılmış kayıt başlamamış sayılmaz', () => {
    expect(isNotStarted(sub({ status: 'paused', start_date: '2026-11-01' }), today)).toBe(false);
  });
});

describe('toplamlar', () => {
  const items = [
    sub({ id: 'monthly', amount: '100', currency: 'TRY', billing_cycle: 'monthly' }),
    sub({ id: 'yearly', amount: '1200', currency: 'TRY', billing_cycle: 'yearly' }),
    sub({ id: 'usd', amount: '10', currency: 'USD', billing_cycle: 'monthly' }),
    sub({ id: 'paused', status: 'paused', amount: '999', currency: 'TRY' }),
    sub({ id: 'future', start_date: '2026-12-01', amount: '500', currency: 'TRY' }),
  ];

  it('toplamlar yalnızca aktif ve başlamış kayıtları alır', () => {
    const active = activeForTotals(items, today);
    expect(active.map((s) => s.id).sort()).toEqual(['monthly', 'usd', 'yearly']);
  });

  it('aylık toplam para birimi başına ayrı tutulur', () => {
    const totals = monthlyTotalsByCurrency(activeForTotals(items, today));
    expect(totals.get('TRY')?.decimalString).toBe('200.00');
    expect(totals.get('USD')?.decimalString).toBe('10.00');
  });

  it('yıllık 100,00 abonelik yıllık toplamda 100,00 kalır (yuvarlama kaybı yok)', () => {
    const yearly = yearlyTotalsByCurrency([sub({ id: 'y', amount: '100', billing_cycle: 'yearly' })]);
    expect(yearly.get('TRY')?.decimalString).toBe('100.00');
  });

  it('yıllık eşdeğer: haftalık x52, üç aylık x4', () => {
    const yearly = yearlyTotalsByCurrency([
      sub({ id: 'w', amount: '1', billing_cycle: 'weekly' }),
      sub({ id: 'q', amount: '10', billing_cycle: 'quarterly' }),
    ]);
    expect(yearly.get('TRY')?.decimalString).toBe('92.00');
  });

  it('yıllık toplam aylık toplamın 12 katıdır', () => {
    const yearly = yearlyTotalsByCurrency(activeForTotals(items, today));
    expect(yearly.get('TRY')?.decimalString).toBe('2400.00');
    expect(yearly.get('USD')?.decimalString).toBe('120.00');
  });
});

describe('yaklaşan ödemeler ve denemeler', () => {
  it('7 günlük pencerede yalnızca aktif kayıtlar sayılır', () => {
    const items = [
      sub({ id: 'soon', next_renewal_date: '2026-10-12' }),
      sub({ id: 'later', next_renewal_date: '2026-10-30' }),
      sub({ id: 'trial-soon', status: 'trial', next_renewal_date: '2026-10-11' }),
    ];
    expect(renewingWithin(items, today, 7).map((s) => s.id)).toEqual(['soon']);
  });

  it('sıradaki ödeme 30 gün içindeki en yakın aktif yenilemedir', () => {
    const items = [sub({ id: 'far', next_renewal_date: '2026-11-20' }), sub({ id: 'near', next_renewal_date: '2026-10-20' })];
    expect(nextPayment(items, today)?.id).toBe('near');
    expect(nextPayment([sub({ next_renewal_date: '2026-12-31' })], today)).toBeNull();
  });

  it('denemeler bitiş tarihine göre sıralanır', () => {
    const items = [
      sub({ id: 'late', status: 'trial', trial_end_date: '2026-10-30' }),
      sub({ id: 'early', status: 'trial', trial_end_date: '2026-10-12' }),
      sub({ id: 'active' }),
    ];
    expect(trialsByEnd(items).map((s) => s.id)).toEqual(['early', 'late']);
  });
});
