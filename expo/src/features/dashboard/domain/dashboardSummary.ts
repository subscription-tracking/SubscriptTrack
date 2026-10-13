import { Money } from '../../../core/domain/money';
import { type CivilDate, dayNumber } from '../../../core/time/calendar';
import { annualEquivalent, monthlyEquivalent, type Subscription } from '../../subscriptions/domain/subscription';
import { renewingWithin } from '../../subscriptions/domain/activeSelectors';

export { activeForTotals, compareByRenewal, isNotStarted, renewingWithin } from '../../subscriptions/domain/activeSelectors';

/**
 * Ana sayfa hesapları ([PRODUCT §6.3](../../../../../docs/product/PRODUCT.md), Flutter
 * `SubscriptionSelectors` ile aynı). Para birimleri birbirine çevrilmez; her toplam para
 * birimi başına tutulur. I/O yoktur.
 */

/** Para birimi başına aylık tahmini toplam (her kaydın aylık eşdeğeri). */
export function monthlyTotalsByCurrency(active: readonly Subscription[]): Map<string, Money> {
  const totals = new Map<string, Money>();
  for (const subscription of active) {
    const current = totals.get(subscription.currency) ?? Money.zero;
    totals.set(subscription.currency, current.add(monthlyEquivalent(subscription)));
  }
  return totals;
}

/** Para birimi başına yıllık tahmin: her kaydın yıllık eşdeğerinin toplamı (yuvarlama kaybı yok). */
export function yearlyTotalsByCurrency(active: readonly Subscription[]): Map<string, Money> {
  const yearly = new Map<string, Money>();
  for (const subscription of active) {
    const current = yearly.get(subscription.currency) ?? Money.zero;
    yearly.set(subscription.currency, current.add(annualEquivalent(subscription)));
  }
  return yearly;
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

