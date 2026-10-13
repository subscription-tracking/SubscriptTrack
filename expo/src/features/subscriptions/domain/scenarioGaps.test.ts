import { formatCurrency } from '../../../core/format/money';
import { Money } from '../../../core/domain/money';
import { parseCivilDate } from '../../../core/time/calendar';
import { paymentFromRow } from '../../stats/domain/paymentEvents';
import { planReminders } from '../../notifications/domain/reminderPlanner';
import { compareByRenewal } from './activeSelectors';
import { subscriptionFromRow, type Subscription, type SubscriptionRow } from './subscription';

function subscription(overrides: Partial<SubscriptionRow> & { id: string; name: string }): Subscription {
  return subscriptionFromRow({
    amount: '49.90',
    currency: 'TRY',
    billing_cycle: 'monthly',
    category: 'streaming',
    status: 'active',
    start_date: '2026-01-01',
    next_renewal_date: '2026-10-20',
    payment_method: null,
    notes: null,
    website: null,
    trial_end_date: null,
    trial_price_after: null,
    ...overrides,
  } satisfies SubscriptionRow);
}

// Senaryo 9: para birimi sembolü ve biçimi (TRY/USD/EUR ayrı, binlik nokta, ondalık virgül).
describe('para birimi biçimi (senaryo 9)', () => {
  it('TRY, USD ve EUR sembollerini ve Türkçe sayı biçimini kullanır', () => {
    expect(formatCurrency(Money.fromJson('1234.5'), 'TRY')).toBe('₺1.234,50');
    expect(formatCurrency(Money.fromJson('9.99'), 'USD')).toBe('$9,99');
    expect(formatCurrency(Money.fromJson('1000'), 'EUR')).toBe('€1.000,00');
  });

  it('bilinmeyen para kodunu olduğu gibi yazar', () => {
    expect(formatCurrency(Money.fromJson('5'), 'CHF')).toBe('CHF5,00');
  });
});

// Senaryo 24: yenileme tarihine göre sıralama, eşit tarihte ada göre, sonra kimliğe göre.
describe('yenileme tarihine göre sıralama (senaryo 24)', () => {
  it('en yakın yenileme önce gelir', () => {
    const later = subscription({ id: 'b', name: 'B', next_renewal_date: '2026-11-01' });
    const sooner = subscription({ id: 'a', name: 'A', next_renewal_date: '2026-10-15' });
    expect([later, sooner].sort(compareByRenewal).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('eşit tarihte ada, sonra kimliğe göre sıralar', () => {
    const same = '2026-10-15';
    const zed = subscription({ id: 'z', name: 'Zed', next_renewal_date: same });
    const alpha = subscription({ id: 'm', name: 'Alpha', next_renewal_date: same });
    const alphaTwin = subscription({ id: 'k', name: 'Alpha', next_renewal_date: same });
    expect([zed, alpha, alphaTwin].sort(compareByRenewal).map((item) => item.id)).toEqual(['k', 'm', 'z']);
  });
});

// Senaryo 7: aynı isimli iki abonelik ayrı kimlikle kalır; biri diğerinin yerine geçmez.
describe('aynı isimli abonelikler (senaryo 7)', () => {
  it('iki kayıt da sıralamada korunur ve birbirinden ayrılır', () => {
    const first = subscription({ id: 'first', name: 'Netflix' });
    const second = subscription({ id: 'second', name: 'Netflix' });
    const sorted = [second, first].sort(compareByRenewal);
    expect(sorted).toHaveLength(2);
    expect(new Set(sorted.map((item) => item.id)).size).toBe(2);
  });
});

// Senaryo 33: yenileme tarihi bugün olan abonelik için hatırlatma, belirlenen saatte bugün planlanır.
describe('son tarihi bugün olan abonelik (senaryo 33)', () => {
  it('bugünkü yenileme için 09:00 İstanbul saatinde, gün farkı 0 ile planlar', () => {
    const today = parseCivilDate('2026-10-12');
    if (!today) throw new Error('fixture date');
    const planned = planReminders({
      active: [subscription({ id: 'today', name: 'Bugün', next_renewal_date: '2026-10-12' })],
      trials: [],
      defaultDays: 0,
      hour: 9,
      timeZone: 'Europe/Istanbul',
      now: new Date('2026-10-12T04:00:00.000Z'),
    });
    expect(planned).toHaveLength(1);
    expect(planned[0].scheduled.toISOString()).toBe('2026-10-12T06:00:00.000Z');
    expect(planned[0].body).toContain('Bugün yenileniyor');
  });

  it('saat geçmişse normal hatırlatma yerine tek seferlik yedek bildirim planlanır', () => {
    const now = new Date('2026-10-12T07:00:00.000Z');
    const planned = planReminders({
      active: [subscription({ id: 'past', name: 'Geçmiş', next_renewal_date: '2026-10-12' })],
      trials: [],
      defaultDays: 0,
      hour: 9,
      timeZone: 'Europe/Istanbul',
      now,
    });
    expect(planned).toHaveLength(1);
    expect(planned[0].identifier.startsWith('st:c|past|')).toBe(true);
    expect(planned[0].scheduled.getTime()).toBe(now.getTime() + 60_000);
    expect(planned[0].body).toContain('Bugün yenileniyor');
  });
});

// Senaryo 13: geçmiş ödeme kaydı kendi tutarını taşır; abonelik fiyatı sonradan değişse de değişmez.
describe('fiyat güncellemesi ve geçmiş ödeme (senaryo 13)', () => {
  it('ödeme satırının tutarı abonelik fiyatından bağımsızdır', () => {
    const paidRow = { id: 'p1', subscription_id: 's1', amount: '49.90', currency: 'TRY', paid_at: '2026-09-20T09:00:00.000Z', status: 'PAID' };
    const payment = paymentFromRow(paidRow);
    const updatedSubscription = subscription({ id: 's1', name: 'Netflix', amount: '59.90' });
    expect(payment.amount.decimalString).toBe('49.90');
    expect(updatedSubscription.amount.decimalString).toBe('59.90');
  });
});
