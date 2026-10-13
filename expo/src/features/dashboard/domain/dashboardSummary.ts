import { dayNumber } from '../../../core/time/calendar';
import { type Subscription } from '../../subscriptions/domain/subscription';

export { activeForTotals, compareByRenewal, isNotStarted, renewingWithin } from '../../subscriptions/domain/activeSelectors';

/**
 * Ana sayfa hesapları ([PRODUCT §6.3](../../../../../docs/product/PRODUCT.md), Flutter
 * `SubscriptionSelectors` ile aynı). Para birimleri birbirine çevrilmez; her toplam para
 * birimi başına tutulur. I/O yoktur.
 */

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

