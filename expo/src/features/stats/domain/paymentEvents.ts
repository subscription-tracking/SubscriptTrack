import { Money } from '../../../core/domain/money';
import { type CivilDate, zoneToday, zonedHourToUtc } from '../../../core/time/calendar';

/**
 * Ödeme kaydı ve aylık analiz (Flutter `PaymentEvent` ve `PaymentAnalytics` ile aynı).
 * Toplamlar minör birimle (tam sayı) yapılır; ay sınırı kullanıcının IANA saat dilimindedir.
 * I/O yoktur.
 */

export interface PaymentEvent {
  id: string;
  subscriptionId: string | null;
  amount: Money;
  currency: string;
  /** ISO 8601 (UTC). */
  paidAt: string;
  /** `PAID` toplamlara girer; `DEFERRED` yalnızca geçmişte ertelendi olarak görünür. */
  status: 'PAID' | 'DEFERRED';
}

/** `payment_events` satırını alan modeline çevirir. Durum yoksa ödenmiş sayılır. */
export function paymentFromRow(row: {
  id: string;
  subscription_id: string | null;
  amount: string | number;
  currency: string;
  paid_at: string;
  status?: string | null;
}): PaymentEvent {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    amount: Money.fromJson(row.amount),
    currency: row.currency,
    paidAt: row.paid_at,
    status: row.status === 'DEFERRED' ? 'DEFERRED' : 'PAID',
  };
}

function monthKey(day: CivilDate): number {
  return day.year * 12 + day.month - 1;
}

/** Belirli bir ayda kullanıcı saat diliminde ödenen toplam, minör birimle. */
export function totalForMonth(events: readonly PaymentEvent[], currency: string, month: Date, timeZone: string): number {
  const key = monthKey(zoneToday(timeZone, month));
  let total = 0;
  for (const event of events) {
    if (event.status !== 'DEFERRED' && event.currency === currency && monthKey(localCivilDate(event.paidAt, timeZone)) === key) {
      total += event.amount.minorUnits;
    }
  }
  return total;
}

/** Son `months` ayın toplamları, eskiden yeniye. */
export function monthlyTotals(events: readonly PaymentEvent[], currency: string, now: Date, months: number, timeZone: string): number[] {
  const current = zoneToday(timeZone, now);
  return Array.from({ length: months }, (_, index) => {
    const first = new Date(Date.UTC(current.year, current.month - 1 - (months - 1 - index), 1));
    const month = zonedHourToUtc({ year: first.getUTCFullYear(), month: first.getUTCMonth() + 1, day: 1 }, 12, timeZone);
    return totalForMonth(events, currency, month, timeZone);
  });
}

/**
 * Bu ay ile geçen ay arasındaki yüzde değişim. Karşılaştırılacak veri yoksa (geçen ay 0)
 * `null`. Yuvarlama yalnızca son adımda yapılır.
 */
export function monthOverMonthPercent(events: readonly PaymentEvent[], currency: string, now: Date, timeZone: string): number | null {
  const today = zoneToday(timeZone, now);
  const current = totalForMonth(events, currency, now, timeZone);
  const prior = new Date(Date.UTC(today.year, today.month - 2, 1));
  const previous = totalForMonth(events, currency, zonedHourToUtc({ year: prior.getUTCFullYear(), month: prior.getUTCMonth() + 1, day: 1 }, 12, timeZone), timeZone);
  if (previous === 0) return null;
  return Math.round(((current - previous) * 100) / previous);
}

/** ISO zamanının kullanıcı saat dilimindeki takvim günü. */
export function localCivilDate(iso: string, timeZone: string): CivilDate {
  return zoneToday(timeZone, new Date(iso));
}

/** Seçilen takvim gününü kullanıcı saat dilimindeki öğleye çevirir. */
export function paidAtFromCivil(day: CivilDate, timeZone: string): Date {
  return zonedHourToUtc(day, 12, timeZone);
}

/** Düzenleme/ekleme tutarı: pozitif ve geçerli bir değer; değilse null. */
export function parsePaymentAmount(input: string): Money | null {
  const money = Money.tryParse(input);
  if (!money || money.compareTo(Money.zero) <= 0) return null;
  return money;
}
