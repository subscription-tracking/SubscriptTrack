import { groupByDay, groupTitleFor, rowActionsFor } from './notificationGroups';
import { type Subscription } from '../../subscriptions/domain/subscription';

const now = new Date('2026-10-13T09:00:00Z');
const tz = 'Europe/Istanbul';

describe('groupTitleFor', () => {
  it('günleri başlıklara ayırır', () => {
    expect(groupTitleFor('2026-10-13T05:00:00Z', now, tz)).toBe('Bugün');
    expect(groupTitleFor('2026-10-12T21:30:00Z', now, tz)).toBe('Bugün');
    expect(groupTitleFor('2026-10-12T05:00:00Z', now, tz)).toBe('Dün');
    expect(groupTitleFor('2026-10-08T05:00:00Z', now, tz)).toBe('Bu hafta');
    expect(groupTitleFor('2026-10-01T05:00:00Z', now, tz)).toBe('Daha eski');
  });
});

describe('groupByDay', () => {
  it('boş grupları atar ve sırayı korur', () => {
    const groups = groupByDay([{ createdAt: '2026-10-01T05:00:00Z' }, { createdAt: '2026-10-13T05:00:00Z' }], now, tz);
    expect(groups.map((g) => g.title)).toEqual(['Bugün', 'Daha eski']);
  });
});

describe('rowActionsFor', () => {
  const today = { year: 2026, month: 10, day: 13 };
  const subscription = (overrides: object) =>
    ({ status: 'active', nextRenewalDate: { year: 2026, month: 10, day: 13 }, ...overrides }) as unknown as Subscription;

  it('vadesi gelmiş yenilemede Ödendi ile birlikte eylem verir', () => {
    expect(rowActionsFor('renewal_today', subscription({}), today)).toEqual({ canPay: true });
  });

  it('deneme türünde Ödendi vermez', () => {
    expect(rowActionsFor('trial_today', subscription({ status: 'trial' }), today)).toEqual({ canPay: false });
  });

  it('vadesi gelmemiş ya da bulunamayan abonelikte eylem vermez', () => {
    expect(rowActionsFor('renewal_soon', subscription({ nextRenewalDate: { year: 2026, month: 10, day: 20 } }), today)).toBeNull();
    expect(rowActionsFor('renewal_today', undefined, today)).toBeNull();
  });
});
