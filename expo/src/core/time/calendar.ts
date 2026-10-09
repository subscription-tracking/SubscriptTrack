/**
 * Takvim günü ve fatura döngüsü hesapları. Flutter `DateTimeUtils` sınıfının
 * karşılığıdır ([ADR 0005](../../../../docs/decisions/0005-utc-and-user-timezone.md)).
 *
 * Tarihler `CivilDate` (yıl/ay/gün) olarak taşınır; saat dilimi ve yaz saati
 * kayması bu hesaplara girmez. Kullanıcının "bugünü" yalnızca [zoneToday] ile,
 * kullanıcının IANA zaman diliminde çözülür.
 */

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface CivilDate {
  readonly year: number;
  /** 1–12 */
  readonly month: number;
  /** 1–31 */
  readonly day: number;
}

const MS_PER_DAY = 86_400_000;

export function civilDate(year: number, month: number, day: number): CivilDate {
  return { year, month, day };
}

/** API'nin `date` alanı: `"YYYY-MM-DD"`. */
export function parseCivilDate(value: string): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return civilDate(year, month, day);
}

export function formatCivilDate(date: CivilDate): string {
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

/** Takvim gününün 1970-01-01'den bu yana gün sayısı. İki günün farkı tam gün sayısıdır. */
export function dayNumber(date: CivilDate): number {
  return Math.round(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

export function daysBetween(from: CivilDate, to: CivilDate): number {
  return dayNumber(to) - dayNumber(from);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Ay ekler; gün, hedef ayın son gününü aşarsa son güne sabitler.
 * 31 Ocak + 1 ay = 28 Şubat (veya artık yılda 29 Şubat), 31 Mart'a taşmaz.
 */
export function addMonthsClamped(date: CivilDate, months: number): CivilDate {
  return addMonthsWithPreferredDay(date, months, undefined);
}

/**
 * Ay ekler ve faturalama gününü korur. 31 Ocak tercihli gün 31 ise:
 * 28 Şubat → 31 Mart. Yalnızca hedef ay kısa olduğunda gün düşer.
 */
function addMonthsWithPreferredDay(
  date: CivilDate,
  months: number,
  preferredDay: number | undefined,
): CivilDate {
  const totalMonths = date.month - 1 + months;
  const year = date.year + Math.floor(totalMonths / 12);
  const month = (((totalMonths % 12) + 12) % 12) + 1;
  const lastDay = daysInMonth(year, month);
  const wanted = preferredDay ?? date.day;
  return civilDate(year, month, Math.min(Math.max(wanted, 1), lastDay));
}

const CYCLE_MONTHS: Partial<Record<BillingCycle, number>> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** Tek bir fatura döngüsü ilerletir. `preferredDay` fatura gününü korur. */
export function nextRenewalDate(
  current: CivilDate,
  cycle: BillingCycle,
  anchorDay: number,
): CivilDate {
  if (cycle === 'weekly') {
    return addDays(current, 7);
  }
  return addMonthsWithPreferredDay(current, CYCLE_MONTHS[cycle] ?? 1, anchorDay);
}

/**
 * `anchor` + N·döngü tarihlerinden, `reference` gününde veya sonrasında ilk
 * olanı döner. `anchor` henüz gelmemişse (başlangıç ileride) aynen döner.
 */
export function nextOccurrenceOnOrAfter(
  anchor: CivilDate,
  cycle: BillingCycle,
  reference: CivilDate,
  originalAnchorDay: number = anchor.day,
): CivilDate {
  const referenceDay = dayNumber(reference);
  let current = anchor;
  while (dayNumber(current) < referenceDay) {
    current = nextRenewalDate(current, cycle, originalAnchorDay);
  }
  return current;
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const shifted = new Date((dayNumber(date) + days) * MS_PER_DAY);
  return civilDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Bir anın, verilen IANA saat dilimindeki takvim günü.
 * Örn. 2026-10-08T22:30Z, Europe/Istanbul için 2026-10-09'dur.
 */
export function zoneToday(timeZone: string, instant: Date = new Date()): CivilDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return civilDate(read('year'), read('month'), read('day'));
}

/** Cihazın IANA saat dilimi. Belirlenemezse UTC. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
