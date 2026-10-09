import { type CivilDate } from '../../../core/time/calendar';
import { isRenewingSoon } from './subscriptionList';
import { monthlyEquivalent, type Subscription, type SubscriptionCategory } from './subscription';

/**
 * Liste filtreleri ve sıralaması (PARITY: durum, kategori, para birimi, yaklaşan tarih;
 * Flutter `filter_sheet` ve `filterAndSortSubscriptions` ile sıra ve anlam aynıdır). I/O yoktur.
 *
 * Durum sekmeleri ayrı tutulur ([subscriptionList.ts](subscriptionList.ts)); bu modül
 * sekmeden sonra uygulanan seçimleri yönetir.
 */

export const SORT_OPTIONS = ['date', 'amountAsc', 'amountDesc', 'name'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  date: 'Yenileme tarihine göre',
  amountAsc: 'Fiyat: artan',
  amountDesc: 'Fiyat: azalan',
  name: 'İsme göre',
};

export interface SubscriptionFilter {
  category: SubscriptionCategory | null;
  currency: string | null;
  /** Önümüzdeki 7 gün içinde yenilenecek aktif/deneme kayıtları. */
  dueSoon: boolean;
  sort: SortOption;
}

export const DEFAULT_FILTER: SubscriptionFilter = {
  category: null,
  currency: null,
  dueSoon: false,
  sort: 'date',
};

/** Sıfırlanmış olmayan süzgeç sayısı (sıralama süzgeç sayılmaz). Rozet için. */
export function activeFilterCount(filter: SubscriptionFilter): number {
  return [filter.category !== null, filter.currency !== null, filter.dueSoon].filter(Boolean).length;
}

/** Listede bulunan para birimleri, alfabetik. Yalnızca mevcut kayıtlardan türetilir. */
export function availableCurrencies(subscriptions: readonly Subscription[]): string[] {
  return [...new Set(subscriptions.map((subscription) => subscription.currency))].sort();
}

/**
 * Süzgeci uygular. Girdi değiştirilmez. Tarih sıralaması girdinin sırasını korur
 * (sekme aşamasında yenileme tarihine göre sıralanmış olur). Fiyat sıralaması aylık
 * eşdeğere göre yapılır; farklı para birimleri karşılaştırılmaz, yalnızca gösterilen
 * sayılar sıralanır (Flutter ile aynı).
 */
export function applyFilter(
  subscriptions: readonly Subscription[],
  filter: SubscriptionFilter,
  today: CivilDate,
): Subscription[] {
  const filtered = subscriptions.filter(
    (subscription) =>
      (filter.category === null || subscription.category === filter.category) &&
      (filter.currency === null || subscription.currency === filter.currency) &&
      (!filter.dueSoon || isRenewingSoon(subscription, today)),
  );

  switch (filter.sort) {
    case 'date':
      return filtered;
    case 'amountAsc':
      return filtered.sort((a, b) => monthlyEquivalent(a).compareTo(monthlyEquivalent(b)));
    case 'amountDesc':
      return filtered.sort((a, b) => monthlyEquivalent(b).compareTo(monthlyEquivalent(a)));
    case 'name':
      return filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }
}
