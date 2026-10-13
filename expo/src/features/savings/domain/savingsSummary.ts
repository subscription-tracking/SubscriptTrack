import { Money } from '../../../core/domain/money';
import { monthlyEquivalent, type Subscription } from '../../subscriptions/domain/subscription';
import { type SavingsDraft, type SavingsEventType } from '../../subscriptions/domain/subscriptionOperations';

/**
 * Tasarruf kuralları ([DOMAIN §6](../../../../../docs/product/DOMAIN.md), Flutter `savings_event`
 * ve `payment_history_store.recordSavings` ile aynı). Duraklatma ve iptalde aylık eşdeğer
 * kaydedilir; yıllık tasarruf aylık × 12. Para birimleri ayrı toplanır. I/O yoktur.
 */

export type { SavingsDraft, SavingsEventType } from '../../subscriptions/domain/subscriptionOperations';

export interface SavingsEvent {
  subscriptionId: string | null;
  eventType: string;
  annual: Money;
  currency: string;
  effectiveAt: string;
}

export function savingsDraftFor(subscription: Subscription, eventType: SavingsEventType): SavingsDraft {
  const monthly = monthlyEquivalent(subscription);
  return {
    eventType,
    monthlyAmount: monthly.decimalString,
    annualAmount: monthly.multiply(12).decimalString,
    currency: subscription.currency,
  };
}

/** Para birimi başına toplam yıllık tasarruf. */
export function savingsTotalsByCurrency(events: readonly SavingsEvent[]): Map<string, Money> {
  const totals = new Map<string, Money>();
  for (const event of events) {
    totals.set(event.currency, (totals.get(event.currency) ?? Money.zero).add(event.annual));
  }
  return totals;
}

export interface PotentialSaving {
  subscription: Subscription;
  annual: Money;
}

/**
 * "Tasarruf fırsatları": aktif kayıtların olası yıllık maliyeti, büyükten küçüğe.
 * Para birimleri karışık olabileceğinden sıralama yalnızca gösterilen sayılara göre yapılır (Flutter ile aynı).
 */
export function potentialSavings(active: readonly Subscription[]): PotentialSaving[] {
  return active
    .map((subscription) => ({ subscription, annual: monthlyEquivalent(subscription).multiply(12) }))
    .sort((a, b) => b.annual.compareTo(a.annual));
}

/** Geçmiş satırı başlığı: "İptal edildi · 10 Ekim 2026" ya da tarih yoksa yalnızca "Duraklatıldı". */
export function savingsEventTitle(eventType: string, dateText: string | null): string {
  const base = eventType === 'PAUSED' ? 'Duraklatıldı' : 'İptal edildi';
  return dateText ? `${base} · ${dateText}` : base;
}

/** Üst özet cümlesi: "İlk 3 abonelik yılda ₺1.080,00 tutuyor." */
export function topCostSentence(count: number, yearlyText: string): string {
  return count === 1 ? `Bu abonelik yılda ${yearlyText} tutuyor.` : `İlk ${count} abonelik yılda ${yearlyText} tutuyor.`;
}
