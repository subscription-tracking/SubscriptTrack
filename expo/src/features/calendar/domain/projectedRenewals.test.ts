import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { overdueSubscriptions } from './calendarDays';
import { projectedRenewalDates } from './projectedRenewals';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'id',
  name: 'Ad',
  amount: '10',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: '2026-01-31',
  next_renewal_date: '2026-10-31',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
} as SubscriptionRow);
const make = (overrides: Partial<SubscriptionRow>) => subscriptionFromRow(row(overrides));
const today = civilDate(2026, 10, 13);
const days = (s: ReturnType<typeof make>, y: number, m: number) => projectedRenewalDates(s, today, y, m).map((d) => d.day);

describe('projectedRenewalDates', () => {
  it('aylık yenilemeyi sonraki aylara yansıtır, ay sonunu kırpar ve günü korur', () => {
    const s = make({});
    expect(days(s, 2026, 10)).toEqual([31]);
    expect(days(s, 2026, 11)).toEqual([30]);
    expect(days(s, 2026, 12)).toEqual([31]);
    expect(days(s, 2027, 2)).toEqual([28]);
  });
  it('haftalık yenileme bir ayda birden çok gün verir', () => {
    const s = make({ billing_cycle: 'weekly', next_renewal_date: '2026-10-14' });
    expect(days(s, 2026, 10)).toEqual([14, 21, 28]);
  });
  it('üç aylık ve yıllık yenilemeyi yalnız döngü aylarında gösterir', () => {
    const q = make({ billing_cycle: 'quarterly', next_renewal_date: '2026-10-15' });
    expect(days(q, 2026, 11)).toEqual([]);
    expect(days(q, 2027, 1)).toEqual([15]);
    const y = make({ billing_cycle: 'yearly', next_renewal_date: '2026-12-01' });
    expect(days(y, 2027, 12)).toEqual([1]);
  });
  it('geçmiş aylar için projeksiyon yapmaz', () => {
    expect(days(make({}), 2026, 9)).toEqual([]);
  });
  it('vadesi geçmiş kaydı kendi tarihinde gösterir ve sonrasını bugünden sonraki döngüyle sürdürür', () => {
    const s = make({ next_renewal_date: '2026-10-08', start_date: '2026-01-08' });
    expect(days(s, 2026, 10)).toEqual([8]);
    expect(days(s, 2026, 11)).toEqual([8]);
    expect(overdueSubscriptions([s], today)).toHaveLength(1);
  });
  it('aktif olmayanlar boş döner', () => {
    expect(days(make({ status: 'paused' }), 2026, 10)).toEqual([]);
  });
});
