import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import {
  monthGrid,
  monthTotalsByCurrency,
  renewalDaysInMonth,
  renewalsOnDay,
  shiftMonth,
  trialDaysInMonth,
  trialsOnDay,
} from './calendarDays';

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

describe('monthGrid', () => {
  it('pazartesi başlar: 1 Ekim 2026 Perşembe, önünde 3 boşluk', () => {
    const cells = monthGrid(2026, 10);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]?.date).toEqual(civilDate(2026, 10, 1));
  });

  it('her satır 7 hücredir ve tüm günler yer alır', () => {
    const cells = monthGrid(2026, 2);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(28);
  });

  it('artık yılda 29 Şubat yer alır', () => {
    expect(monthGrid(2028, 2).filter(Boolean)).toHaveLength(29);
  });
});

describe('gün olayları', () => {
  const items = [
    sub({ id: 'renew', next_renewal_date: '2026-10-15' }),
    sub({ id: 'paused', status: 'paused', next_renewal_date: '2026-10-15' }),
    sub({ id: 'trial', status: 'trial', next_renewal_date: '2026-10-20', trial_end_date: '2026-10-15' }),
  ];

  it('yenileme yalnızca aktif kayıtlar için gösterilir', () => {
    expect(renewalsOnDay(items, today, civilDate(2026, 10, 15)).map((s) => s.id)).toEqual(['renew']);
  });
  it('shows future starting renewal in calendar but excludes it from current totals', () => {
    const future = sub({ id: 'future', start_date: '2026-10-20', next_renewal_date: '2026-10-20' });
    expect(renewalsOnDay([future], today, civilDate(2026, 10, 20))).toHaveLength(1);
    expect(renewalDaysInMonth([future], today, 2026, 10).has(20)).toBe(true);
    expect(monthTotalsByCurrency([future], today, 2026, 10).size).toBe(0);
  });

  it('deneme bitişi ayrı listelenir', () => {
    expect(trialsOnDay(items, civilDate(2026, 10, 15)).map((s) => s.id)).toEqual(['trial']);
  });

  it('ayın yenileme ve deneme günleri ayrı kümelerde döner', () => {
    expect([...renewalDaysInMonth(items, today, 2026, 10)]).toEqual([15]);
    expect([...trialDaysInMonth(items, 2026, 10)]).toEqual([15]);
  });
});

describe('monthTotalsByCurrency', () => {
  it('o ayın yenilemelerini para birimi başına toplar', () => {
    const items = [
      sub({ amount: '100', currency: 'TRY', next_renewal_date: '2026-10-15' }),
      sub({ amount: '5', currency: 'USD', next_renewal_date: '2026-10-02' }),
      sub({ amount: '300', currency: 'TRY', next_renewal_date: '2026-11-01' }),
    ];
    const totals = monthTotalsByCurrency(items, today, 2026, 10);
    expect(totals.get('TRY')?.decimalString).toBe('100.00');
    expect(totals.get('USD')?.decimalString).toBe('5.00');
  });
});

describe('shiftMonth', () => {
  it('yıl sınırında taşar', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 10, 0)).toEqual({ year: 2026, month: 10 });
  });
});
