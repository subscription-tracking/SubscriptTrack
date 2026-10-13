import { Money } from '../../../core/domain/money';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import type { PaymentEvent } from '../../stats/domain/paymentEvents';
import { annualChipLabel, categoryTotals, donutEntries, monthChangeLabel } from './dashboardHero';

const sub = (overrides: Partial<SubscriptionRow>) =>
  subscriptionFromRow({
    id: 'id',
    name: 'Ad',
    amount: '10',
    currency: 'TRY',
    billing_cycle: 'monthly',
    category: 'streaming',
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

describe('annualChipLabel', () => {
  it('toplam yoksa aktif para biriminin sıfırını gösterir', () => {
    expect(annualChipLabel(new Map(), 'USD')).toBe('Yıllık: $0,00');
  });

  it('her para birimini ayrı gösterir', () => {
    const label = annualChipLabel(new Map([['TRY', Money.parse('100')], ['USD', Money.parse('20')]]));
    expect(label).toContain('/ yıl');
    expect(label.split(' · ')).toHaveLength(2);
  });
});

describe('categoryTotals', () => {
  it('farklı para birimlerini aynı grupta toplamaz', () => {
    const totals = categoryTotals([
      sub({ id: 'a', amount: '10', currency: 'TRY' }),
      sub({ id: 'b', amount: '5', currency: 'USD' }),
      sub({ id: 'c', amount: '20', currency: 'TRY' }),
    ]);
    expect(totals).toHaveLength(2);
    expect(totals.find((total) => total.currency === 'TRY')?.amount.decimalString).toBe('30.00');
    expect(totals.find((total) => total.currency === 'USD')?.amount.decimalString).toBe('5.00');
  });

  it('halka yalnızca ana para birimindeki grupları alır', () => {
    const { primaryCurrency, entries } = donutEntries(
      categoryTotals([sub({ id: 'a', currency: 'TRY' }), sub({ id: 'b', currency: 'USD' })]),
    );
    expect(primaryCurrency).toBe('TRY');
    expect(entries).toHaveLength(1);
  });
});

describe('monthChangeLabel', () => {
  const now = new Date('2026-10-13T09:00:00Z');
  const payment = (iso: string, amount: string, currency = 'TRY'): PaymentEvent => ({
    id: iso + amount,
    subscriptionId: 's',
    amount: Money.parse(amount),
    currency,
    paidAt: iso,
    status: 'PAID',
  });

  it('kısmi ayı yüzdeyle kıyaslamaz, geçen ay ödenen toplamı yazar', () => {
    const label = monthChangeLabel([payment('2026-09-05T09:00:00Z', '100'), payment('2026-10-02T09:00:00Z', '5')], now, 'Europe/Istanbul', 'TRY');
    expect(label).toContain('Geçen ay ödenen');
    expect(label).toContain('100');
    expect(label).not.toContain('%');
  });

  it('geçen ay ödeme yoksa ya da kayıt yoksa gösterilmez', () => {
    expect(monthChangeLabel([], now, 'Europe/Istanbul')).toBeNull();
    expect(monthChangeLabel([payment('2026-10-02T09:00:00Z', '5')], now, 'Europe/Istanbul', 'TRY')).toBeNull();
  });
});
