import { civilDate } from '../../../core/time/calendar';
import { Money } from '../../../core/domain/money';
import {
  type Subscription,
  type SubscriptionRow,
  daysUntilRenewal,
  monthlyEquivalent,
  subscriptionFromRow,
} from './subscription';
import { countsByTab, isRenewingSoon, visibleSubscriptions } from './subscriptionList';

const row = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'id-1',
  name: 'Netflix',
  amount: '199.99',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-15',
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

const make = (overrides: Partial<SubscriptionRow> = {}): Subscription => subscriptionFromRow(row(overrides));

describe('subscriptionFromRow', () => {
  it('ondalık tutarı Money olarak okur ve tarihleri takvim gününe çevirir', () => {
    const subscription = make();
    expect(subscription.amount.decimalString).toBe('199.99');
    expect(subscription.nextRenewalDate).toEqual(civilDate(2026, 10, 15));
  });

  it('bilinmeyen kategori, döngü ve durum için güvenli varsayılan kullanır', () => {
    const subscription = make({ category: 'uzay', billing_cycle: 'bilinmiyor', status: '???' });
    expect(subscription.category).toBe('other');
    expect(subscription.billingCycle).toBe('monthly');
    expect(subscription.status).toBe('active');
  });
});

describe('monthlyEquivalent', () => {
  it('yıllık tutarı 12 ile böler', () => {
    expect(monthlyEquivalent(make({ amount: '120', billing_cycle: 'yearly' })).decimalString).toBe('10.00');
  });

  it('üç aylık tutarı 3 ile böler', () => {
    expect(monthlyEquivalent(make({ amount: '30', billing_cycle: 'quarterly' })).decimalString).toBe('10.00');
  });

  it('haftalık tutarı 52/12 ile çarpar', () => {
    expect(monthlyEquivalent(make({ amount: '10', billing_cycle: 'weekly' })).decimalString).toBe('43.33');
  });

  it('aylık tutarı olduğu gibi döner', () => {
    expect(monthlyEquivalent(make({ amount: '9.99' })).equals(Money.parse('9.99'))).toBe(true);
  });
});

describe('daysUntilRenewal', () => {
  it('bugünden yenileme gününe kalan tam günü verir', () => {
    expect(daysUntilRenewal(make(), civilDate(2026, 10, 9))).toBe(6);
  });

  it('yenileme tarihi yoksa null döner', () => {
    expect(daysUntilRenewal(make({ next_renewal_date: null }), civilDate(2026, 10, 9))).toBeNull();
  });
});

describe('liste sekmeleri ve arama', () => {
  const list: Subscription[] = [
    make({ id: 'a', name: 'Spotify', status: 'active', next_renewal_date: '2026-10-20' }),
    make({ id: 'b', name: 'Netflix', status: 'active', next_renewal_date: '2026-10-12' }),
    make({ id: 'c', name: 'Adobe', status: 'trial', next_renewal_date: '2026-10-11' }),
    make({ id: 'd', name: 'Gym', status: 'paused', next_renewal_date: null }),
    make({ id: 'e', name: 'Dergi', status: 'expired', next_renewal_date: '2026-09-01' }),
  ];

  it('aktif sekmesinde yalnızca aktif kayıtları yenileme tarihine göre sıralar', () => {
    expect(visibleSubscriptions(list, 'active', '').map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('tarihi olmayan kayıtlar listenin sonuna gider', () => {
    expect(visibleSubscriptions(list, 'history', '').map((s) => s.id)).toEqual(['e', 'd']);
  });

  it('arama ad içinde büyük/küçük harf duyarsız eşleşir', () => {
    expect(visibleSubscriptions(list, 'active', 'SPOT').map((s) => s.id)).toEqual(['a']);
  });

  it('sekme sayıları her durumu ayrı sayar', () => {
    expect(countsByTab(list)).toEqual({ active: 2, trial: 1, history: 2 });
  });

  it('arşivlenmiş kayıt listelerde görünmez', () => {
    const archived = [make({ id: 'z', status: 'archived' })];
    expect(countsByTab(archived)).toEqual({ active: 0, trial: 0, history: 0 });
  });
});

describe('isRenewingSoon', () => {
  const today = civilDate(2026, 10, 9);

  it('7 gün içinde yenilenen aktif kayıt vurgulanır', () => {
    expect(isRenewingSoon(make({ next_renewal_date: '2026-10-16' }), today)).toBe(true);
  });

  it('8 gün sonrası vurgulanmaz', () => {
    expect(isRenewingSoon(make({ next_renewal_date: '2026-10-17' }), today)).toBe(false);
  });

  it('duraklatılmış kayıt, yakın olsa da vurgulanmaz', () => {
    expect(isRenewingSoon(make({ status: 'paused', next_renewal_date: '2026-10-10' }), today)).toBe(false);
  });
});
