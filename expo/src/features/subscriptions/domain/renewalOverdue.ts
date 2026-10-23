import { addDays, type CivilDate, daysInMonth, dayNumber, nextOccurrenceOnOrAfter } from '../../../core/time/calendar';
import { type Subscription } from './subscription';

/**
 * Vadesi gelen yenileme: aktif veya deneme kaydının yenileme tarihi bugün veya daha önce.
 * Otomatik ilerletme yapılmaz ([PARITY §4](../../../../../docs/expo/PARITY.md));
 * kullanıcı "yenilendi" diye onaylayınca tarih ilerletilir. I/O yoktur.
 */

/** Gecikmiş yenileme için kullanıcıya gösterilen metin. */
export const OVERDUE_LABEL = 'Yenileme tarihi geçti';

export function isRenewalDue(subscription: Subscription, today: CivilDate): boolean {
  if (subscription.status !== 'active' && subscription.status !== 'trial') return false;
  if (!subscription.nextRenewalDate) return false;
  return dayNumber(subscription.nextRenewalDate) <= dayNumber(today);
}

/**
 * Onaylanınca yazılacak yeni yenileme tarihi: bugünden sonraki ilk döngü tarihi.
 * Faturalama günü korunur; başlangıç günü varsa ay sonu kırpması (ör. 31 → 30) bu günden
 * yeniden hesaplanır. Vadesi gelmemişse null.
 */
export function advancedRenewalDate(subscription: Subscription, today: CivilDate): CivilDate | null {
  if (!isRenewalDue(subscription, today) || !subscription.nextRenewalDate) return null;
  return nextOccurrenceOnOrAfter(
    subscription.nextRenewalDate,
    subscription.billingCycle,
    addDays(today, 1),
    billingDay(subscription),
  );
}

/**
 * Faturalama günü. Yenileme tarihi ayın son günündeyse kırpılmış olabilir (ör. 31 → 30);
 * bu durumda başlangıç günü geri kazanılır. Diğer günlerde yenileme günü kullanılır.
 */
function billingDay(subscription: Subscription): number {
  const next = subscription.nextRenewalDate;
  if (!next) return 1;
  const isMonthEnd = next.day === daysInMonth(next.year, next.month);
  if (!isMonthEnd || !subscription.startDate) return next.day;
  return Math.max(next.day, subscription.startDate.day);
}
