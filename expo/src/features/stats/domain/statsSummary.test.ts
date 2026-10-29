import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { monthOverMonthPercent, monthlyTotals, paymentFromRow, totalForMonth, type PaymentEvent } from './paymentEvents';
import { buildStatsSummary } from './statsSummary';
import { savingsDraftFor, savingsTotalsByCurrency, potentialSavings, type SavingsEvent } from '../../savings/domain/savingsSummary';
import { Money } from '../../../core/domain/money';
import { upcomingByDay } from '../../dashboard/domain/homeSummary';
import { countsByTab } from '../../subscriptions/domain/subscriptionList';

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

const timeZone = 'Europe/Istanbul';
const payment = (id: string, amount: string, currency: string, month: number, day = 15): PaymentEvent =>
  paymentFromRow({
    id,
    subscription_id: null,
    amount,
    currency,
    paid_at: new Date(Date.UTC(2026, month - 1, day, 9)).toISOString(),
  });

const now = new Date('2026-10-09T09:00:00.000Z');
const today = civilDate(2026, 10, 9);

describe('ödeme analizi', () => {
  const payments = [payment('a', '100', 'TRY', 10), payment('b', '50', 'TRY', 9), payment('c', '20', 'USD', 10)];

  it('ay toplamı yalnızca istenen para birimini sayar', () => {
    expect(totalForMonth(payments, 'TRY', now, timeZone)).toBe(10000);
    expect(totalForMonth(payments, 'USD', now, timeZone)).toBe(2000);
  });

  it('son 6 ay eskiden yeniye sıralanır', () => {
    const trend = monthlyTotals(payments, 'TRY', now, 6, timeZone);
    expect(trend).toHaveLength(6);
    expect(trend[5]).toBe(10000);
    expect(trend[4]).toBe(5000);
  });

  it('yüzde değişim geçen ay 0 ise null', () => {
    expect(monthOverMonthPercent([payment('x', '10', 'TRY', 10)], 'TRY', now, timeZone)).toBeNull();
  });

  it('yüzde değişim: (bu ay − geçen ay) / geçen ay', () => {
    expect(monthOverMonthPercent(payments, 'TRY', now, timeZone)).toBe(100);
  });

  it('ay sınırını cihaz yerine profil saat diliminde hesaplar', () => {
    const boundary = paymentFromRow({ id: 'boundary', subscription_id: null, amount: '10', currency: 'TRY', paid_at: '2026-10-01T00:30:00.000Z' });
    const instant = new Date('2026-10-15T12:00:00.000Z');
    expect(totalForMonth([boundary], 'TRY', instant, 'Europe/Istanbul')).toBe(1000);
    expect(totalForMonth([boundary], 'TRY', instant, 'America/New_York')).toBe(0);
    expect(monthlyTotals([boundary], 'TRY', instant, 2, 'America/New_York')).toEqual([1000, 0]);
  });
});

describe('buildStatsSummary', () => {
  const items = [
    sub({ id: 'a', amount: '100', currency: 'TRY', billing_cycle: 'monthly', category: 'streaming', next_renewal_date: '2026-10-12' }),
    sub({ id: 'b', amount: '1200', currency: 'TRY', billing_cycle: 'yearly', category: 'cloud', next_renewal_date: '2026-12-01' }),
    sub({ id: 'c', amount: '5', currency: 'USD', billing_cycle: 'monthly', category: 'music' }),
    sub({ id: 'p', status: 'paused', amount: '999' }),
  ];

  it('aylık toplam aktif kayıtlardan, yıllık = aylık × 12', () => {
    const summary = buildStatsSummary({ subscriptions: items, payments: [], today, now, timeZone, activeCurrency: 'TRY' })!;
    expect(summary.currency).toBe('TRY');
    expect(summary.monthly.decimalString).toBe('200.00');
    expect(summary.yearly.decimalString).toBe('2400.00');
    expect(summary.activeCount).toBe(2);
  });

  it('aktif para birimi dışındaki kayıtlar hesaba katılmaz', () => {
    const summary = buildStatsSummary({ subscriptions: items, payments: [], today, now, timeZone, activeCurrency: 'USD' })!;
    expect(summary.currency).toBe('USD');
    expect(summary.monthly.decimalString).toBe('5.00');
    expect(summary.highest?.id).toBe('c');
  });

  it('aktif sayısı para birimi kapsamındadır; liste sayısı bütün para birimlerini kapsar', () => {
    expect(countsByTab(items).active).toBe(3);
    expect(buildStatsSummary({ subscriptions: items, payments: [], today, now, timeZone, activeCurrency: 'TRY' })?.activeCount).toBe(2);
  });

  it('7 günlük sayı tüm yenilemeleri içerir, bugün ve 8. gün hariç dashboard ile eşleşir', () => {
    const subs = [0, 1, 2, 3, 4, 7, 8].map((days) => sub({ id: `s${days}`, currency: days % 2 ? 'USD' : 'TRY', next_renewal_date: `2026-10-${String(9 + days).padStart(2, '0')}` }));
    const summary = buildStatsSummary({ subscriptions: subs, payments: [], today, now, timeZone, activeCurrency: 'TRY' })!;
    const dashboard = upcomingByDay(subs, today, 7).flatMap((day) => day.entries.filter((entry) => entry.kind === 'renewal').map((entry) => entry.subscription.id));
    expect(summary.dueSoon.map((item) => item.id)).toEqual(dashboard);
    expect(summary.dueSoon.map((item) => item.id)).toEqual(['s1', 's2', 's3', 's4', 's7']);
  });

  it('kategoriler aylık tutara göre büyükten küçüğe sıralanır', () => {
    const summary = buildStatsSummary({ subscriptions: items, payments: [], today, now, timeZone, activeCurrency: 'TRY' })!;
    expect(summary.categories.map((share) => share.category)).toEqual(['streaming', 'cloud']);
  });

  it('aktif kayıt yoksa özet null', () => {
    expect(buildStatsSummary({ subscriptions: [sub({ status: 'paused' })], payments: [], today, now, timeZone, activeCurrency: 'TRY' })).toBeNull();
  });

  it('ödeme geçmişi yoksa trend bayrağı false', () => {
    const summary = buildStatsSummary({ subscriptions: items, payments: [], today, now, timeZone, activeCurrency: 'TRY' })!;
    expect(summary.hasPaymentHistory).toBe(false);
  });
});

describe('tasarruf', () => {
  it('duraklatma ve iptalde aylık eşdeğer kaydedilir; yıllık = aylık × 12', () => {
    const yearly = sub({ amount: '1200', billing_cycle: 'yearly' });
    expect(savingsDraftFor(yearly, 'CANCELLED')).toEqual({
      eventType: 'CANCELLED',
      monthlyAmount: '100.00',
      annualAmount: '1200.00',
      currency: 'TRY',
    });
  });

  it('kaydedilen tasarruf para birimi başına toplanır', () => {
    const events: SavingsEvent[] = [
      { subscriptionId: 'a', eventType: 'PAUSED', annual: Money.parse('1200'), currency: 'TRY', effectiveAt: '2026-10-01T00:00:00Z' },
      { subscriptionId: 'b', eventType: 'CANCELLED', annual: Money.parse('300'), currency: 'TRY', effectiveAt: '2026-10-02T00:00:00Z' },
      { subscriptionId: 'c', eventType: 'CANCELLED', annual: Money.parse('60'), currency: 'USD', effectiveAt: '2026-10-03T00:00:00Z' },
    ];
    const totals = savingsTotalsByCurrency(events);
    expect(totals.get('TRY')?.decimalString).toBe('1500.00');
    expect(totals.get('USD')?.decimalString).toBe('60.00');
  });

  it('fırsatlar olası yıllık maliyete göre büyükten küçüğe', () => {
    const opportunities = potentialSavings([
      sub({ id: 'small', amount: '10' }),
      sub({ id: 'big', amount: '500' }),
    ]);
    expect(opportunities.map((item) => item.subscription.id)).toEqual(['big', 'small']);
    expect(opportunities[0].annual.decimalString).toBe('6000.00');
  });
});
