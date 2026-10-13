import { Money } from '../../../core/domain/money';
import { civilDate } from '../../../core/time/calendar';
import { type PaymentEvent } from '../../stats/domain/paymentEvents';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { attentionItems, monthPaymentSummary, upcomingByDay } from './homeSummary';

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
const now = new Date('2026-10-13T09:00:00.000Z');
const zone = 'Europe/Istanbul';

const payment = (amount: string, paidAt: string, currency = 'TRY', status: PaymentEvent['status'] = 'PAID'): PaymentEvent => ({
  id: `${paidAt}${amount}`,
  subscriptionId: 's',
  amount: Money.parse(amount),
  currency,
  paidAt,
  status,
});

describe('monthPaymentSummary', () => {
  it('ay sonuna kadar vadesi olanları kalan, bu ay ödenenleri ödenen sayar', () => {
    const active = [
      sub({ id: 'a', amount: '100', next_renewal_date: '2026-10-06' }),
      sub({ id: 'b', amount: '50.5', next_renewal_date: '2026-10-31' }),
      sub({ id: 'c', amount: '999', next_renewal_date: '2026-11-01' }),
    ];
    const [tl] = monthPaymentSummary(active, [payment('30', '2026-10-07T08:00:00.000Z')], today, now, zone);
    expect(tl.currency).toBe('TRY');
    expect(tl.remaining.decimalString).toBe('150.50');
    expect(tl.paid.decimalString).toBe('30.00');
    expect(tl.total.decimalString).toBe('180.50');
  });

  it('ertelenen ödeme ve önceki ay ödemesi toplama girmez', () => {
    const [tl] = monthPaymentSummary(
      [sub({ amount: '40', next_renewal_date: '2026-10-20' })],
      [payment('500', '2026-10-05T08:00:00.000Z', 'TRY', 'DEFERRED'), payment('70', '2026-09-20T08:00:00.000Z')],
      today, now, zone,
    );
    expect(tl.paid.decimalString).toBe('0.00');
    expect(tl.remaining.decimalString).toBe('40.00');
  });

  it('haftalık kayıt ay sonuna kadar her vadede sayılır', () => {
    const [tl] = monthPaymentSummary([sub({ amount: '10', billing_cycle: 'weekly', next_renewal_date: '2026-10-13' })], [], today, now, zone);
    expect(tl.remaining.decimalString).toBe('30.00');
  });

  it('para birimlerini ayrı tutar ve tercih edileni başa alır', () => {
    const result = monthPaymentSummary(
      [sub({ amount: '5', currency: 'USD', next_renewal_date: '2026-10-14' }), sub({ amount: '70', currency: 'TRY', next_renewal_date: '2026-10-14' })],
      [], today, now, zone, 'USD',
    );
    expect(result.map((item) => item.currency)).toEqual(['USD', 'TRY']);
    expect(result[0].remaining.decimalString).toBe('5.00');
  });

  it('kayıt ve ödeme yoksa boş döner', () => {
    expect(monthPaymentSummary([], [], today, now, zone)).toEqual([]);
  });
});

describe('attentionItems', () => {
  it('bugün ve geçmiş vadeleri en eski önce sıralar, gelecekleri dışlar', () => {
    const items = attentionItems(
      [
        sub({ id: 'today', name: 'Bugün', next_renewal_date: '2026-10-13' }),
        sub({ id: 'old', name: 'Eski', next_renewal_date: '2026-10-06' }),
        sub({ id: 'future', name: 'Gelecek', next_renewal_date: '2026-10-14' }),
        sub({ id: 'paused', name: 'Duraklı', status: 'paused', next_renewal_date: '2026-10-01' }),
      ],
      today,
    );
    expect(items.map((item) => [item.subscription.id, item.daysOverdue])).toEqual([['old', 7], ['today', 0]]);
  });
});

describe('upcomingByDay', () => {
  it('yarından başlayıp günlere gruplar, deneme bitişini ayrı türle verir', () => {
    const days = upcomingByDay(
      [
        sub({ id: 'a', name: 'A', next_renewal_date: '2026-10-15' }),
        sub({ id: 'b', name: 'B', next_renewal_date: '2026-10-15' }),
        sub({ id: 't', name: 'T', status: 'trial', trial_end_date: '2026-10-20', next_renewal_date: '2026-10-20' }),
        sub({ id: 'far', name: 'Uzak', next_renewal_date: '2026-11-20' }),
        sub({ id: 'today', name: 'Bugün', next_renewal_date: '2026-10-13' }),
      ],
      today,
    );
    expect(days.map((day) => [day.dayOffset, day.entries.map((entry) => `${entry.kind}:${entry.subscription.id}`)])).toEqual([
      [2, ['renewal:a', 'renewal:b']],
      [7, ['trialEnd:t']],
    ]);
  });

  it('pencere dışını ve boş listeyi dışlar', () => {
    expect(upcomingByDay([], today)).toEqual([]);
    expect(upcomingByDay([sub({ next_renewal_date: '2026-10-28' })], today, 14)).toEqual([]);
  });
});
