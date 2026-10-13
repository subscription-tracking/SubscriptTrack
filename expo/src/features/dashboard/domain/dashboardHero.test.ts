import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { categoryTotals, donutEntries } from './dashboardHero';

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
