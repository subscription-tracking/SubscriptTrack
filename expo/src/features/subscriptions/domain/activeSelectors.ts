import { type CivilDate, daysBetween, dayNumber } from '../../../core/time/calendar';
import type { Subscription } from './subscription';

/**
 * Aktif, başlamamış ve yenileme penceresi seçicileri (Flutter `SubscriptionSelectors` ile aynı).
 * Ana sayfa ve istatistik modülleri bu dosyayı ortak kullanır; feature'lar arası döngü oluşmaz.
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
  const byDate = dayA === dayB ? 0 : dayA - dayB;
  return byDate || a.name.localeCompare(b.name, 'tr-TR') || a.id.localeCompare(b.id);
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
