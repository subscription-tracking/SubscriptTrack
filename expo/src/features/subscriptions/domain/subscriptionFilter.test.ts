import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, type Subscription, subscriptionFromRow } from './subscription';
import { DEFAULT_FILTER, activeFilterCount, applyFilter, availableCurrencies, type SubscriptionFilter } from './subscriptionFilter';

const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'id',
  name: 'Ad',
  amount: '10',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: null,
  next_renewal_date: '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

const sub = (overrides: Partial<SubscriptionRow>): Subscription => subscriptionFromRow(row(overrides));

const today = civilDate(2026, 10, 9);
const filter = (overrides: Partial<SubscriptionFilter>): SubscriptionFilter => ({ ...DEFAULT_FILTER, ...overrides });

const netflix = sub({ id: 'n', name: 'Netflix', category: 'streaming', amount: '149.99', next_renewal_date: '2026-10-12' });
const spotify = sub({ id: 's', name: 'Spotify', category: 'music', amount: '59.90', currency: 'TRY', next_renewal_date: '2026-10-25' });
const icloud = sub({ id: 'i', name: 'iCloud', category: 'cloud', amount: '4.99', currency: 'USD', billing_cycle: 'yearly', next_renewal_date: '2027-01-02' });
const all = [netflix, spotify, icloud];

describe('applyFilter', () => {
  it('varsayılan süzgeç her kaydı sırasıyla döndürür', () => {
    expect(applyFilter(all, DEFAULT_FILTER, today).map((s) => s.id)).toEqual(['n', 's', 'i']);
  });

  it('kategoriye göre süzer', () => {
    expect(applyFilter(all, filter({ category: 'music' }), today).map((s) => s.id)).toEqual(['s']);
  });

  it('para birimine göre süzer; karışık para birimlerini toplamaz', () => {
    expect(applyFilter(all, filter({ currency: 'USD' }), today).map((s) => s.id)).toEqual(['i']);
  });

  it('yaklaşan yenilemeler yalnızca 7 gün içindekileri tutar', () => {
    expect(applyFilter(all, filter({ dueSoon: true }), today).map((s) => s.id)).toEqual(['n']);
  });

  it('fiyat sıralaması aylık eşdeğere göre yapılır', () => {
    // Aylık eşdeğerler: Netflix 149.99, Spotify 59.90, iCloud 4.99/12 ≈ 0.42
    expect(applyFilter(all, filter({ sort: 'amountAsc' }), today).map((s) => s.id)).toEqual(['i', 's', 'n']);
    expect(applyFilter(all, filter({ sort: 'amountDesc' }), today).map((s) => s.id)).toEqual(['n', 's', 'i']);
  });

  it('isme göre sıralar', () => {
    expect(applyFilter(all, filter({ sort: 'name' }), today).map((s) => s.name)).toEqual(['iCloud', 'Netflix', 'Spotify']);
  });

  it('girdi dizisini değiştirmez', () => {
    const copy = [...all];
    applyFilter(all, filter({ sort: 'amountDesc' }), today);
    expect(all).toEqual(copy);
  });
});

describe('activeFilterCount', () => {
  it('sıralama süzgeç sayılmaz', () => {
    expect(activeFilterCount(filter({ sort: 'name' }))).toBe(0);
    expect(activeFilterCount(filter({ category: 'music', dueSoon: true }))).toBe(2);
  });
});

describe('availableCurrencies', () => {
  it('benzersiz ve sıralı para birimleri döner', () => {
    expect(availableCurrencies(all)).toEqual(['TRY', 'USD']);
  });
});
