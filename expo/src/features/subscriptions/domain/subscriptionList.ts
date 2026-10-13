import { type CivilDate, dayNumber } from '../../../core/time/calendar';
import { type Subscription, type SubscriptionStatus } from './subscription';
import { isRenewalDue } from './renewalOverdue';

/**
 * Liste sekmeleri ve sıralama (Flutter `SubscriptionListViewModel` karşılığı).
 * Arşivlenmiş kayıtlar bu listede yer almaz; kendi ekranlarında görünür.
 */

/** Flutter ile aynı üç sekme: Aktif, Deneme, Geçmiş (duraklatılmış, iptal edilmiş ve süresi dolmuş kayıtlar). */
export type ListTab = 'active' | 'trial' | 'history';

export const LIST_TABS: readonly { key: ListTab; label: string; statuses: SubscriptionStatus[] }[] = [
  { key: 'active', label: 'Aktif', statuses: ['active'] },
  { key: 'trial', label: 'Deneme', statuses: ['trial'] },
  { key: 'history', label: 'Geçmiş', statuses: ['paused', 'cancelled', 'expired'] },
];

export function tabFor(key: ListTab): (typeof LIST_TABS)[number] {
  const tab = LIST_TABS.find((item) => item.key === key);
  if (!tab) throw new RangeError(`Bilinmeyen sekme: ${key}`);
  return tab;
}

/** Her sekmedeki kayıt sayısı (rozet için). */
export function countsByTab(subscriptions: readonly Subscription[]): Record<ListTab, number> {
  const counts = { active: 0, trial: 0, history: 0 } satisfies Record<ListTab, number>;
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
  if (dayA === dayB) return a.name.localeCompare(b.name, 'tr-TR') || a.id.localeCompare(b.id);
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

/**
 * Geciken ödemeler: yenileme tarihi bugün veya geçmişte olan aktif/deneme kayıtları. Mevcut sıra
 * her iki grupta da korunur; yalnızca gruplar ayrılır.
 */
export function splitAttention(
  subscriptions: readonly Subscription[],
  today: CivilDate,
): { attention: Subscription[]; rest: Subscription[] } {
  const attention: Subscription[] = [];
  const rest: Subscription[] = [];
  for (const subscription of subscriptions) (isRenewalDue(subscription, today) ? attention : rest).push(subscription);
  return { attention, rest };
}
