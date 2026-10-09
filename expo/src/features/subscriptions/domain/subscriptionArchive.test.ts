import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from './subscription';
import { archivedSubscriptions, visibleSubscriptions } from './subscriptionList';

const row = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'id',
  name: 'Ad',
  amount: '10',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'other',
  status: 'active',
  start_date: null,
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

describe('arşiv ayrımı (Flutter ile aynı)', () => {
  it('is_archived doğruysa durum ne olursa olsun arşivdir', () => {
    expect(subscriptionFromRow(row({ status: 'active', is_archived: true })).status).toBe('archived');
  });

  it('durumu archived olan kayıt da arşivdir', () => {
    expect(subscriptionFromRow(row({ status: 'archived', is_archived: false })).status).toBe('archived');
  });

  it('arşivdeki kayıt aktif sekmede görünmez, arşiv listesinde görünür', () => {
    const subs = [
      subscriptionFromRow(row({ id: 'a', name: 'Aktif' })),
      subscriptionFromRow(row({ id: 'b', name: 'Eski', status: 'archived' })),
    ];
    expect(visibleSubscriptions(subs, 'active', '').map((s) => s.id)).toEqual(['a']);
    expect(archivedSubscriptions(subs).map((s) => s.id)).toEqual(['b']);
  });

  it('arşiv listesi yenileme tarihine göre sıralanır', () => {
    const subs = [
      subscriptionFromRow(row({ id: 'late', status: 'archived', next_renewal_date: '2026-12-01' })),
      subscriptionFromRow(row({ id: 'early', status: 'archived', next_renewal_date: '2026-10-01' })),
    ];
    expect(archivedSubscriptions(subs).map((s) => s.id)).toEqual(['early', 'late']);
    expect(archivedSubscriptions(subs)[0].nextRenewalDate).toEqual(civilDate(2026, 10, 1));
  });

  it('bildirim kuralı yoksa boş liste döner', () => {
    expect(subscriptionFromRow(row({ notification_rules: null })).notificationRules).toEqual([]);
  });
});
