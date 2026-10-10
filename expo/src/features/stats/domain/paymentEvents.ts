import { Money } from '../../../core/domain/money';
import { type CivilDate, civilDate } from '../../../core/time/calendar';

/**
 * Ödeme kaydı ve aylık analiz (Flutter `PaymentEvent` ve `PaymentAnalytics` ile aynı).
 * Toplamlar minör birimle (tam sayı) yapılır; ay sınırı cihazın yerel saatine göre belirlenir.
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

function localMonthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/** Belirli bir ayda (yerel saat) para birimi cinsinden ödenen toplam, minör birimle. */
export function totalForMonth(events: readonly PaymentEvent[], currency: string, month: Date): number {
  const key = localMonthKey(month);
  let total = 0;
  for (const event of events) {
    if (event.status !== 'DEFERRED' && event.currency === currency && localMonthKey(new Date(event.paidAt)) === key) {
      total += event.amount.minorUnits;
    }
  }
  return total;
}

/** Son `months` ayın toplamları, eskiden yeniye. */
export function monthlyTotals(events: readonly PaymentEvent[], currency: string, now: Date, months = 6): number[] {
  return Array.from({ length: months }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return totalForMonth(events, currency, month);
  });
}

/**
 * Bu ay ile geçen ay arasındaki yüzde değişim. Karşılaştırılacak veri yoksa (geçen ay 0)
 * `null`. Yuvarlama yalnızca son adımda yapılır.
 */
export function monthOverMonthPercent(events: readonly PaymentEvent[], currency: string, now: Date): number | null {
  const current = totalForMonth(events, currency, now);
  const previous = totalForMonth(events, currency, new Date(now.getFullYear(), now.getMonth() - 1, 1));
  if (previous === 0) return null;
  return Math.round(((current - previous) * 100) / previous);
}

/** Yerel takvim gününü (ISO zamanından) verir. Ay sınırı cihaz saatine göre belirlenir. */
export function localCivilDate(iso: string): CivilDate {
  const date = new Date(iso);
  return civilDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Seçilen takvim gününü kayda yazılacak zamana çevirir: yerel öğle (gün kaymasını önlemek için). */
export function paidAtFromCivil(day: CivilDate): Date {
  return new Date(day.year, day.month - 1, day.day, 12, 0, 0);
}

/** Düzenleme/ekleme tutarı: pozitif ve geçerli bir değer; değilse null. */
export function parsePaymentAmount(input: string): Money | null {
  const money = Money.tryParse(input);
  if (!money || money.compareTo(Money.zero) <= 0) return null;
  return money;
}
