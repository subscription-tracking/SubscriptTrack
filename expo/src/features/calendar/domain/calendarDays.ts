import { Money } from '../../../core/domain/money';
import { type CivilDate, civilDate, dayNumber, daysInMonth } from '../../../core/time/calendar';
import { activeForTotals } from '../../dashboard/domain/dashboardSummary';
import { type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Takvim hesapları (Flutter `CalendarController` ile aynı kurallar). Yalnızca aktif kayıtlar
 * yenileme olarak gösterilir; deneme bitişleri ayrı listelenir. Para birimleri ayrı toplanır.
 * I/O yoktur.
 */

export interface MonthCell {
  date: CivilDate;
}

/**
 * Ay ızgarası: pazartesi başlangıçlı haftalar. Ayın önündeki ve sonundaki boşluklar `null`dır.
 * Her satır 7 hücredir.
 */
export function monthGrid(year: number, month: number): (MonthCell | null)[] {
  const first = civilDate(year, month, 1);
  const leading = mondayIndex(first);
  const cells: (MonthCell | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    cells.push({ date: civilDate(year, month, day) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Pazartesi=0 … Pazar=6. Gün adı için UTC takvimi kullanılır; saat dilimi etkilemez. */
function mondayIndex(date: CivilDate): number {
  const sundayFirst = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

export function renewalsOnDay(subscriptions: readonly Subscription[], today: CivilDate, day: CivilDate): Subscription[] {
  const target = dayNumber(day);
  return activeForTotals(subscriptions, today).filter(
    (subscription) => subscription.nextRenewalDate !== null && dayNumber(subscription.nextRenewalDate) === target,
  );
}

export function trialsOnDay(subscriptions: readonly Subscription[], day: CivilDate): Subscription[] {
  const target = dayNumber(day);
  return subscriptions.filter(
    (subscription) =>
      subscription.status === 'trial' && subscription.trialEndDate !== null && dayNumber(subscription.trialEndDate) === target,
  );
}

/** Ayın hangi günlerinde yenileme var (gün numaraları). */
export function renewalDaysInMonth(subscriptions: readonly Subscription[], today: CivilDate, year: number, month: number): Set<number> {
  const days = new Set<number>();
  for (const subscription of activeForTotals(subscriptions, today)) {
    const date = subscription.nextRenewalDate;
    if (date && date.year === year && date.month === month) days.add(date.day);
  }
  return days;
}

/** Ayın hangi günlerinde deneme bitiyor (gün numaraları). */
export function trialDaysInMonth(subscriptions: readonly Subscription[], year: number, month: number): Set<number> {
  const days = new Set<number>();
  for (const subscription of subscriptions) {
    const date = subscription.trialEndDate;
    if (subscription.status === 'trial' && date && date.year === year && date.month === month) days.add(date.day);
  }
  return days;
}

/** Ayın para birimi başına toplamı: o ayda yenilemesi olan aktif kayıtların aylık eşdeğeri. */
export function monthTotalsByCurrency(
  subscriptions: readonly Subscription[],
  today: CivilDate,
  year: number,
  month: number,
): Map<string, Money> {
  const totals = new Map<string, Money>();
  for (const subscription of activeForTotals(subscriptions, today)) {
    const date = subscription.nextRenewalDate;
    if (!date || date.year !== year || date.month !== month) continue;
    const current = totals.get(subscription.currency) ?? Money.zero;
    totals.set(subscription.currency, current.add(subscription.amount));
  }
  return totals;
}

/** Ay kaydırma: 1–12 sınırında yıla taşar. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
