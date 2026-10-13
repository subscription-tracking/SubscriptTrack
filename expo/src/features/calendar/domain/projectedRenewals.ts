import { type CivilDate, dayNumber, nextRenewalDate } from '../../../core/time/calendar';
import { advancedRenewalDate } from '../../subscriptions/domain/renewalOverdue';
import { type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Aktif bir aboneliğin verilen ayda düşen yenileme günleri (yalnız gösterim; kayıt değişmez).
 * Gelecekteki yenilemeler `nextRenewalDate`ten döngü döngü ilerletilir; faturalama günü korunur.
 * Vadesi geçmiş kayıt yalnızca kendi tarihinde (gecikmiş) görünür, sonrası onaylı "Ödendi" ile ilerler;
 * ilerleyince bugünden sonraki döngüler de projekte edilir. Geçmiş aylar için projeksiyon yapılmaz.
 */
export function projectedRenewalDates(subscription: Subscription, today: CivilDate, year: number, month: number): CivilDate[] {
  const first = subscription.nextRenewalDate;
  if (subscription.status !== 'active' || !first) return [];
  const monthEnd = year * 12 + month;
  const inView = (date: CivilDate) => date.year * 12 + date.month === monthEnd;
  const dates: CivilDate[] = [];
  let current: CivilDate | null = first;
  if (dayNumber(first) < dayNumber(today)) {
    if (inView(first)) dates.push(first);
    current = advancedRenewalDate(subscription, today);
  }
  const anchorDay = first.day;
  // Güvenlik sınırı: haftalık döngüde bile 10 yıl ilerisini hesaplamaz.
  for (let step = 0; current && step < 600; step += 1) {
    if (current.year * 12 + current.month > monthEnd) break;
    if (inView(current)) dates.push(current);
    current = nextRenewalDate(current, subscription.billingCycle, anchorDay);
  }
  return dates;
}

export function renewsOnDay(subscription: Subscription, today: CivilDate, day: CivilDate): boolean {
  return projectedRenewalDates(subscription, today, day.year, day.month).some((date) => date.day === day.day);
}
