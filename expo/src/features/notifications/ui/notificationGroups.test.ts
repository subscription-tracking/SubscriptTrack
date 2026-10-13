import { groupByDay, groupTitleFor } from './notificationGroups';

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
