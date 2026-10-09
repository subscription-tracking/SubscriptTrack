import {
  addMonthsClamped,
  civilDate,
  daysBetween,
  formatCivilDate,
  isValidTimeZone,
  nextOccurrenceOnOrAfter,
  nextRenewalDate,
  parseCivilDate,
  zoneToday,
} from './calendar';

describe('parseCivilDate / formatCivilDate', () => {
  it('YYYY-MM-DD biçimini gidip gelerek korur', () => {
    const date = parseCivilDate('2026-02-28');
    expect(date).toEqual(civilDate(2026, 2, 28));
    expect(formatCivilDate(date!)).toBe('2026-02-28');
  });

  it('geçersiz takvim tarihini reddeder', () => {
    expect(parseCivilDate('2026-02-30')).toBeNull();
    expect(parseCivilDate('2026/02/28')).toBeNull();
  });
});

describe('addMonthsClamped', () => {
  it('31 Ocak + 1 ay, artık olmayan yılda 28 Şubat olur', () => {
    expect(addMonthsClamped(civilDate(2027, 1, 31), 1)).toEqual(civilDate(2027, 2, 28));
  });

  it('31 Ocak + 1 ay, artık yılda 29 Şubat olur', () => {
    expect(addMonthsClamped(civilDate(2028, 1, 31), 1)).toEqual(civilDate(2028, 2, 29));
  });

  it('yıl sınırını geçer', () => {
    expect(addMonthsClamped(civilDate(2026, 11, 15), 3)).toEqual(civilDate(2027, 2, 15));
  });
});

describe('nextRenewalDate', () => {
  it('fatura gününü korur: 31 Ocak → 28 Şubat → 31 Mart', () => {
    const feb = nextRenewalDate(civilDate(2027, 1, 31), 'monthly', 31);
    expect(feb).toEqual(civilDate(2027, 2, 28));
    expect(nextRenewalDate(feb, 'monthly', 31)).toEqual(civilDate(2027, 3, 31));
  });

  it('haftalık döngü 7 gün ekler ve ay sınırını geçer', () => {
    expect(nextRenewalDate(civilDate(2026, 10, 28), 'weekly', 28)).toEqual(
      civilDate(2026, 11, 4),
    );
  });

  it('üç aylık ve yıllık döngüler doğru ilerler', () => {
    expect(nextRenewalDate(civilDate(2026, 10, 9), 'quarterly', 9)).toEqual(
      civilDate(2027, 1, 9),
    );
    expect(nextRenewalDate(civilDate(2028, 2, 29), 'yearly', 29)).toEqual(
      civilDate(2029, 2, 28),
    );
  });
});

describe('nextOccurrenceOnOrAfter', () => {
  it('henüz gelmemiş başlangıç tarihini aynen döner', () => {
    const anchor = civilDate(2026, 12, 1);
    expect(nextOccurrenceOnOrAfter(anchor, 'monthly', civilDate(2026, 10, 9))).toEqual(anchor);
  });

  it('geçmiş döngüleri atlayıp ilk gelecek tarihi bulur', () => {
    const anchor = civilDate(2026, 1, 15);
    expect(nextOccurrenceOnOrAfter(anchor, 'monthly', civilDate(2026, 10, 9))).toEqual(
      civilDate(2026, 10, 15),
    );
  });

  it('referans gününde tam eşleşirse o günü döner', () => {
    const anchor = civilDate(2026, 1, 15);
    expect(nextOccurrenceOnOrAfter(anchor, 'monthly', civilDate(2026, 10, 15))).toEqual(
      civilDate(2026, 10, 15),
    );
  });
});

describe('daysBetween', () => {
  it('ay ve yıl sınırlarında tam gün sayar', () => {
    expect(daysBetween(civilDate(2026, 10, 9), civilDate(2026, 10, 16))).toBe(7);
    expect(daysBetween(civilDate(2027, 12, 31), civilDate(2028, 1, 1))).toBe(1);
    expect(daysBetween(civilDate(2028, 2, 28), civilDate(2028, 3, 1))).toBe(2);
  });
});

describe('zoneToday (kullanıcının saat dilimi)', () => {
  // 2026-10-08 22:30 UTC: Istanbul (UTC+3) için 9 Ekim, UTC için 8 Ekim
  const instant = new Date('2026-10-08T22:30:00Z');

  it('aynı anı kullanıcının saat diliminde farklı güne çözer', () => {
    expect(zoneToday('Europe/Istanbul', instant)).toEqual(civilDate(2026, 10, 9));
    expect(zoneToday('UTC', instant)).toEqual(civilDate(2026, 10, 8));
  });

  it('gün sınırında (00:30 UTC) önceki takvim gününe düşmez', () => {
    const justAfterMidnightUtc = new Date('2026-10-09T00:30:00Z');
    expect(zoneToday('America/New_York', justAfterMidnightUtc)).toEqual(
      civilDate(2026, 10, 8),
    );
  });

  it('geçerli IANA saat dilimlerini tanır, uydurmaları reddeder', () => {
    expect(isValidTimeZone('Europe/Istanbul')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});
