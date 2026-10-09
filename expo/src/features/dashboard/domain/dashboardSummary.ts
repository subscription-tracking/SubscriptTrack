import { Money } from '../../../core/domain/money';
import { type CivilDate, daysBetween, dayNumber } from '../../../core/time/calendar';
import { monthlyEquivalent, type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Ana sayfa hesapları ([PRODUCT §6.3](../../../../../docs/product/PRODUCT.md), Flutter
 * `SubscriptionSelectors` ile aynı). Para birimleri birbirine çevrilmez; her toplam para
 * birimi başına tutulur. I/O yoktur.
 */

/** Başlangıç günü henüz gelmemiş aktif/deneme kaydı (Flutter `isNotStartedOnDay`). */
export function isNotStarted(subscription: Subscription, today: CivilDate): boolean {
  if (subscription.status !== 'active' && subscription.status !== 'trial') return false;
  return subscription.startDate !== null && dayNumber(subscription.startDate) > dayNumber(today);
}

/** Toplamlara dahil olan aktif kayıtlar, yenileme tarihine göre. */
export function activeForTotals(subscriptions: readonly Subscription[], today: CivilDate): Subscription[] {
  return subscriptions
    .filter((subscription) => subscription.status === 'active' && !isNotStarted(subscription, today))
    .sort(compareByRenewal);
}

export function compareByRenewal(a: Subscription, b: Subscription): number {
  const dayA = a.nextRenewalDate ? dayNumber(a.nextRenewalDate) : Number.POSITIVE_INFINITY;
  const dayB = b.nextRenewalDate ? dayNumber(b.nextRenewalDate) : Number.POSITIVE_INFINITY;
  return dayA - dayB;
}

/** Para birimi başına aylık tahmini toplam (her kaydın aylık eşdeğeri). */
export function monthlyTotalsByCurrency(active: readonly Subscription[]): Map<string, Money> {
  const totals = new Map<string, Money>();
  for (const subscription of active) {
    const current = totals.get(subscription.currency) ?? Money.zero;
    totals.set(subscription.currency, current.add(monthlyEquivalent(subscription)));
  }
  return totals;
}

/** Para birimi başına yıllık tahmin: aylık toplam × 12 ([DOMAIN §6]). */
export function yearlyTotalsByCurrency(active: readonly Subscription[]): Map<string, Money> {
  const yearly = new Map<string, Money>();
  for (const [currency, monthly] of monthlyTotalsByCurrency(active)) {
    yearly.set(currency, monthly.multiply(12));
  }
  return yearly;
}

/** Önümüzdeki `days` gün içinde (bugün dahil) yenilenecek aktif kayıtlar. */
export function renewingWithin(
  subscriptions: readonly Subscription[],
  today: CivilDate,
  days: number,
): Subscription[] {
  return activeForTotals(subscriptions, today).filter((subscription) => {
    if (!subscription.nextRenewalDate) return false;
    const diff = daysBetween(today, subscription.nextRenewalDate);
    return diff >= 0 && diff <= days;
  });
}

/** Ana sayfadaki "Sıradaki ödeme": 30 gün içindeki en yakın aktif yenileme. */
export function nextPayment(subscriptions: readonly Subscription[], today: CivilDate): Subscription | null {
  return renewingWithin(subscriptions, today, 30)[0] ?? null;
}

/** Deneme kayıtları, bitiş tarihine göre. */
export function trialsByEnd(subscriptions: readonly Subscription[]): Subscription[] {
  return subscriptions
    .filter((subscription) => subscription.status === 'trial')
    .sort((a, b) => trialEndDay(a) - trialEndDay(b));
}

function trialEndDay(subscription: Subscription): number {
  const date = subscription.trialEndDate ?? subscription.nextRenewalDate;
  return date ? dayNumber(date) : Number.POSITIVE_INFINITY;
}

