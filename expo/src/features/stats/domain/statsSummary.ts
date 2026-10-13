import { Money } from '../../../core/domain/money';
import { type CivilDate } from '../../../core/time/calendar';
import { activeForTotals, renewingWithin } from '../../subscriptions/domain/activeSelectors';
import { monthlyEquivalent, type Subscription, type SubscriptionCategory } from '../../subscriptions/domain/subscription';
import { monthlyTotals, type PaymentEvent } from './paymentEvents';

/**
 * İstatistik ekranının seçili para birimi için türetilmiş verisi (Flutter `StatsViewModel`
 * ile aynı). Saf fonksiyon; I/O yoktur.
 */

export interface CategoryShare {
  category: SubscriptionCategory;
  monthly: Money;
}

export interface StatsSummary {
  currency: string;
  monthly: Money;
  yearly: Money;
  activeCount: number;
  /** Seçilen pencerenin ödeme toplamları (minör birim), eskiden yeniye. */
  trend: number[];
  hasPaymentHistory: boolean;
  categories: CategoryShare[];
  /** 7 gün içinde yenilenecek en fazla 3 aktif kayıt. */
  dueSoon: Subscription[];
  highest: Subscription | null;
}

export function buildStatsSummary(input: {
  subscriptions: readonly Subscription[];
  payments: readonly PaymentEvent[];
  today: CivilDate;
  now: Date;
  timeZone: string;
  /** Uygulamanın tek aktif para birimi; yalnızca bu para birimindeki kayıtlar hesaplanır. */
  activeCurrency: string;
  /** Trend penceresi: 3, 6 veya 12 ay (Flutter `_months`). */
  months?: number;
}): StatsSummary | null {
  const currency = input.activeCurrency;
  const inCurrency = activeForTotals(input.subscriptions, input.today).filter((subscription) => subscription.currency === currency);
  if (inCurrency.length === 0) return null;
  const monthly = inCurrency.reduce((sum, subscription) => sum.add(monthlyEquivalent(subscription)), Money.zero);

  const categoryTotals = new Map<SubscriptionCategory, Money>();
  for (const subscription of inCurrency) {
    const current = categoryTotals.get(subscription.category) ?? Money.zero;
    categoryTotals.set(subscription.category, current.add(monthlyEquivalent(subscription)));
  }
  const categories = [...categoryTotals.entries()]
    .map(([category, total]) => ({ category, monthly: total }))
    .sort((a, b) => b.monthly.compareTo(a.monthly));

  const highest = [...inCurrency].sort((a, b) => monthlyEquivalent(b).compareTo(monthlyEquivalent(a)))[0] ?? null;

  return {
    currency,
    monthly,
    yearly: monthly.multiply(12),
    activeCount: inCurrency.length,
    trend: monthlyTotals(input.payments, currency, input.now, input.months ?? 6, input.timeZone),
    hasPaymentHistory: input.payments.some((payment) => payment.currency === currency),
    categories,
    dueSoon: renewingWithin(input.subscriptions, input.today, 7).slice(0, 3),
    highest,
  };
}
