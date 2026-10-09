import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { monthOverMonthPercent, type PaymentEvent } from '../../stats/domain/paymentEvents';
import type { Subscription, SubscriptionCategory } from '../../subscriptions/domain/subscription';
import { monthlyEquivalent } from '../../subscriptions/domain/subscription';

/**
 * Ana sayfa kahramanı ve kategori özeti (Flutter `DashboardHeroCard` ve `DashboardCategoryDonutCard`
 * hesaplarıyla aynı). I/O yoktur.
 */

/** Bu takvim ayında en az bir ödeme kaydı girilmiş aktif abonelik sayısı. */
export function completedThisMonth(active: readonly Subscription[], payments: readonly PaymentEvent[], now: Date): number {
  const paidIds = new Set<string>();
  for (const event of payments) {
    const paid = new Date(event.paidAt);
    if (paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth() && event.subscriptionId) {
      paidIds.add(event.subscriptionId);
    }
  }
  return active.filter((subscription) => paidIds.has(subscription.id)).length;
}

/** "Geçen aya göre %12 daha az" biçimi; karşılaştırılacak veri yoksa `null`. Para birimi ilk kaydınkidir (Flutter ile aynı). */
export function monthChangeLabel(payments: readonly PaymentEvent[], now: Date): string | null {
  if (payments.length === 0) return null;
  const percent = monthOverMonthPercent(payments, payments[0].currency, now);
  if (percent === null) return null;
  const direction = percent <= 0 ? 'daha az' : 'daha fazla';
  return `Geçen aya göre %${Math.abs(percent)} ${direction}`;
}

/** Ana sayfa yıllık çipi: ilk para biriminin aylık toplamı × 12, yoksa "Yıllık: ₺0". */
export function annualChipLabel(monthlyTotals: ReadonlyMap<string, Money>): string {
  const first = monthlyTotals.entries().next();
  if (first.done) return 'Yıllık: ₺0';
  const [currency, monthly] = first.value;
  return `${formatCurrency(monthly.multiply(12), currency)} / yıl`;
}

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

/** Grupların aylık toplamı; ekleme sırası korunur (ilk grubun para birimi ana para birimidir). */
export function categoryTotals(active: readonly Subscription[]): CategoryTotal[] {
  const groups = new Map<CategoryGroup, CategoryTotal>();
  for (const subscription of active) {
    const group = categoryGroup(subscription.category);
    const existing = groups.get(group);
    groups.set(group, {
      group,
      amount: (existing?.amount ?? Money.zero).add(monthlyEquivalent(subscription)),
      currency: existing?.currency ?? subscription.currency,
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

/** Yüzde (yuvarlanmış), toplam sıfırsa 0. */
export function percentOf(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
