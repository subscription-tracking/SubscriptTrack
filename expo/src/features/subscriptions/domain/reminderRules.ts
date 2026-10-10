/**
 * Hatırlatma çipleri (Flutter `_reminderPresetDays`: yenileme günü, 1, 3, 7 gün önce). Kurallar
 * `notification_rules` JSON'unda `{ enabled, daysBefore }` olarak tutulur. I/O yoktur.
 */

export const REMINDER_PRESET_DAYS = [0, 1, 3, 7] as const;
/** Sunucunun varsayılan kuralı: 3 gün önce. */
export const DEFAULT_REMINDER_DAYS: readonly number[] = [3];

/** Etkin kuralların gün listesi; hatalı biçimli kayıtlar atlanır. Artan sırada, tekrarsız. */
export function daysFromRules(rules: readonly unknown[]): number[] {
  const values = rules.flatMap((rule) => {
    if (typeof rule !== 'object' || rule === null) return [];
    const { daysBefore, enabled } = rule as { daysBefore?: unknown; enabled?: unknown };
    return enabled === true && typeof daysBefore === 'number' ? [daysBefore] : [];
  });
  return [...new Set(values)].sort((a, b) => a - b);
}

/** İki gün listesi aynı günleri (sıra fark etmeksizin) içeriyor mu? */
export function sameDays(a: readonly number[], b: readonly number[]): boolean {
  const left = [...new Set(a)].sort((x, y) => x - y);
  const right = [...new Set(b)].sort((x, y) => x - y);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Gün listesinden `notification_rules` yükü. */
export function rulesFromDays(days: readonly number[]): { enabled: true; daysBefore: number }[] {
  return [...new Set(days)].sort((a, b) => a - b).map((daysBefore) => ({ enabled: true, daysBefore }));
}

/**
 * Bir çipi açar ya da kapatır. En az bir hatırlatma kalmalı: son kalan kapatılamaz (aynı liste döner).
 */
export function toggleReminderDay(days: readonly number[], day: number): number[] {
  if (days.includes(day)) {
    return days.length === 1 ? [...days] : days.filter((value) => value !== day);
  }
  return [...days, day].sort((a, b) => a - b);
}
