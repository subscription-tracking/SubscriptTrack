import { daysFromRules, rulesFromDays, toggleReminderDay } from './reminderRules';

describe('daysFromRules', () => {
  it('yalnızca etkin kuralların günlerini artan sırada verir', () => {
    expect(daysFromRules([{ enabled: true, daysBefore: 7 }, { enabled: false, daysBefore: 1 }, { enabled: true, daysBefore: 3 }])).toEqual([3, 7]);
  });

  it('hatalı kayıtları atlar', () => {
    expect(daysFromRules([null, 'x', { enabled: true, daysBefore: '3' }])).toEqual([]);
  });
});

describe('rulesFromDays', () => {
  it('her gün için etkin kural üretir, tekrarsız ve sıralı', () => {
    expect(rulesFromDays([7, 0, 7])).toEqual([
      { enabled: true, daysBefore: 0 },
      { enabled: true, daysBefore: 7 },
    ]);
  });
});

describe('toggleReminderDay', () => {
  it('kapalı bir çipi açar ve sıralar', () => {
    expect(toggleReminderDay([3], 0)).toEqual([0, 3]);
  });

  it('açık bir çipi kapatır', () => {
    expect(toggleReminderDay([0, 3], 0)).toEqual([3]);
  });

  it('son kalan çipi kapatmaya izin vermez', () => {
    expect(toggleReminderDay([3], 3)).toEqual([3]);
  });
});
