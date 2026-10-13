import { Money } from '../../../core/domain/money';
import type { Subscription, SubscriptionCategory } from '../../subscriptions/domain/subscription';
import { monthlyEquivalent } from '../../subscriptions/domain/subscription';

/**
 * Ana sayfa kahramanı ve kategori özeti (Flutter `DashboardHeroCard` ve `DashboardCategoryDonutCard`
 * hesaplarıyla aynı). I/O yoktur.
 */

export type CategoryGroup = 'Eğlence' | 'Müzik' | 'Üretkenlik' | 'Araçlar';

/** Abonelik kategorisinin ana sayfa grubu (Flutter `_group`). */
export function categoryGroup(category: SubscriptionCategory): CategoryGroup {
  switch (category) {
    case 'streaming':
    case 'gaming':
    case 'news':
    case 'food':
      return 'Eğlence';
    case 'music':
      return 'Müzik';
    case 'software':
    case 'education':
      return 'Üretkenlik';
    case 'cloud':
    case 'fitness':
    case 'other':
      return 'Araçlar';
  }
}

export interface CategoryTotal {
  group: CategoryGroup;
  amount: Money;
  currency: string;
  count: number;
}

/**
 * Grupların aylık toplamı; ekleme sırası korunur (ilk grubun para birimi ana para birimidir).
 * Grup anahtarı grup + para birimidir: farklı para birimleri tek tutarda toplanmaz.
 */
export function categoryTotals(active: readonly Subscription[]): CategoryTotal[] {
  const groups = new Map<string, CategoryTotal>();
  for (const subscription of active) {
    const group = categoryGroup(subscription.category);
    const key = `${group}|${subscription.currency}`;
    const existing = groups.get(key);
    groups.set(key, {
      group,
      amount: (existing?.amount ?? Money.zero).add(monthlyEquivalent(subscription)),
      currency: subscription.currency,
      count: (existing?.count ?? 0) + 1,
    });
  }
  return [...groups.values()];
}

/** Ana para birimindeki grupları büyükten küçüğe sıralar (Flutter `entries` sıralaması). */
export function donutEntries(totals: readonly CategoryTotal[]): { primaryCurrency: string; entries: CategoryTotal[]; total: number } {
  const primaryCurrency = totals[0]?.currency ?? '';
  const entries = totals
    .filter((entry) => entry.currency === primaryCurrency)
    .sort((a, b) => b.amount.minorUnits - a.amount.minorUnits);
  const total = entries.reduce((sum, entry) => sum + entry.amount.amount, 0);
  return { primaryCurrency, entries, total };
}
