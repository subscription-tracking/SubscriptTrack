import { upcomingDayLabel, weekdayName } from './dayLabel';

describe('upcomingDayLabel', () => {
  it('yarını "Yarın" olarak yazar', () => {
    expect(upcomingDayLabel({ year: 2026, month: 10, day: 14 }, 1)).toBe('Yarın');
  });

  it('diğer günleri tarih ve gün adıyla yazar', () => {
    expect(upcomingDayLabel({ year: 2026, month: 10, day: 15 }, 2)).toBe('15 Ekim · Perşembe');
  });

  it('gün adını doğru bulur', () => {
    expect(weekdayName({ year: 2026, month: 10, day: 18 })).toBe('Pazar');
  });
});
