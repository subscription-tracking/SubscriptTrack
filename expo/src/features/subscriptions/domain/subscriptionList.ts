import { type CivilDate, dayNumber } from '../../../core/time/calendar';
import { type Subscription, type SubscriptionStatus } from './subscription';

/**
 * Liste sekmeleri ve sıralama (Flutter `SubscriptionListViewModel` karşılığı).
 * Arşivlenmiş kayıtlar bu listede yer almaz; kendi ekranlarında görünür.
 */

export type ListTab = 'active' | 'trial' | 'paused' | 'cancelled' | 'expired';

export const LIST_TABS: ReadonlyArray<{ key: ListTab; label: string; statuses: SubscriptionStatus[] }> = [
  { key: 'active', label: 'Aktif', statuses: ['active'] },
  { key: 'trial', label: 'Deneme', statuses: ['trial'] },
  { key: 'paused', label: 'Duraklatıldı', statuses: ['paused'] },
  { key: 'cancelled', label: 'İptal edildi', statuses: ['cancelled'] },
  { key: 'expired', label: 'Geçmiş', statuses: ['expired'] },
];

export function tabFor(key: ListTab): (typeof LIST_TABS)[number] {
  const tab = LIST_TABS.find((item) => item.key === key);
  if (!tab) throw new RangeError(`Bilinmeyen sekme: ${key}`);
  return tab;
}

/** Her sekmedeki kayıt sayısı (rozet için). */
export function countsByTab(subscriptions: readonly Subscription[]): Record<ListTab, number> {
  const counts = { active: 0, trial: 0, paused: 0, cancelled: 0, expired: 0 } satisfies Record<ListTab, number>;
  for (const subscription of subscriptions) {
    for (const tab of LIST_TABS) {
      if (tab.statuses.includes(subscription.status)) counts[tab.key] += 1;
    }
  }
  return counts;
}

/** Arşivlenmiş kayıtlar (arşiv ekranı). Sıra yenileme tarihine göre, sekmelerdeki ile aynı. */
export function archivedSubscriptions(subscriptions: readonly Subscription[]): Subscription[] {
  return subscriptions.filter((subscription) => subscription.status === 'archived').sort(compareByRenewal);
}

/**
 * Sekmeye, aramaya ve sıralamaya göre listeyi üretir. Arama ad ve kategori etiketinde
 * büyük/küçük harf duyarsız eşleşir. Sıralama: yenileme tarihi yakın olan önce,
 * tarihi olmayanlar sona.
 */
export function visibleSubscriptions(
  subscriptions: readonly Subscription[],
  tab: ListTab,
  query: string,
): Subscription[] {
  const statuses = tabFor(tab).statuses;
  const needle = query.trim().toLocaleLowerCase('tr-TR');

  return subscriptions
    .filter((subscription) => statuses.includes(subscription.status))
    .filter((subscription) => needle === '' || subscription.name.toLocaleLowerCase('tr-TR').includes(needle))
    .sort(compareByRenewal);
}

function compareByRenewal(a: Subscription, b: Subscription): number {
  const dayA = renewalDay(a);
  const dayB = renewalDay(b);
  if (dayA === dayB) return a.name.localeCompare(b.name, 'tr-TR');
  return dayA - dayB;
}

function renewalDay(subscription: Subscription): number {
  return subscription.nextRenewalDate ? dayNumber(subscription.nextRenewalDate) : Number.POSITIVE_INFINITY;
}

/** Yenilemesi `days` gün içinde (bugün dahil) olan aktif kayıt mı? Vurgu için (PRODUCT §6.2: 7 gün). */
export function isRenewingSoon(subscription: Subscription, today: CivilDate, days = 7): boolean {
  if (!subscription.nextRenewalDate) return false;
  if (subscription.status !== 'active' && subscription.status !== 'trial') return false;
  const diff = dayNumber(subscription.nextRenewalDate) - dayNumber(today);
  return diff >= 0 && diff <= days;
}
