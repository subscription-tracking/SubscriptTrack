import { Money } from '../../../core/domain/money';
import { type CivilDate } from '../../../core/time/calendar';
import { activeForTotals, renewingWithin } from '../../dashboard/domain/dashboardSummary';
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
  currencies: string[];
  currency: string;
  monthly: Money;
  yearly: Money;
  activeCount: number;
  /** Son 6 ayın ödeme toplamları (minör birim), eskiden yeniye. */
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
  selectedCurrency?: string | null;
}): StatsSummary | null {
  const active = activeForTotals(input.subscriptions, input.today);
  const currencies = [...new Set(active.map((subscription) => subscription.currency))].sort();
  if (currencies.length === 0) return null;

  const currency =
    input.selectedCurrency && currencies.includes(input.selectedCurrency) ? input.selectedCurrency : currencies[0];
  const inCurrency = active.filter((subscription) => subscription.currency === currency);
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
    currencies,
    currency,
    monthly,
    yearly: monthly.multiply(12),
    activeCount: inCurrency.length,
    trend: monthlyTotals(input.payments, currency, input.now),
    hasPaymentHistory: input.payments.some((payment) => payment.currency === currency),
    categories,
    dueSoon: renewingWithin(input.subscriptions, input.today, 7).slice(0, 3),
    highest,
  };
}
