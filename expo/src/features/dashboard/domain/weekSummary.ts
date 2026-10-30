import { Money } from '../../../core/domain/money';
import { MoneyByCurrency } from '../../../core/domain/moneyByCurrency';
import { type UpcomingDay, type UpcomingEntry } from './homeSummary';

/** Ana sayfa "önümüzdeki 7 gün" ve gün şeridi hesapları. Para birimleri çevrilmez. I/O yoktur. */

export interface WeekTotal {
  currency: string;
  total: Money;
}

/** Şeritte bir günün özeti: ödeme sayısı. Sayı para biriminden bağımsızdır; tutarlar başlıkta birim birim gösterilir. */
export interface StripDay {
  count: number;
}

function amountOf(entry: UpcomingEntry): Money | null {
  const { subscription } = entry;
  return entry.kind === 'trialEnd' ? subscription.trialPriceAfter ?? null : subscription.amount;
}

/** İlk `horizon` gündeki (bugün dahil) tutarlar, para birimi başına; tercih edilen para birimi her zaman başta. */
export function weekTotals(days: readonly UpcomingDay[], preferred: string, horizon = 7): WeekTotal[] {
  const totals = new MoneyByCurrency().add(preferred, Money.zero);
  for (const day of days) {
    if (day.dayOffset >= horizon) continue;
    for (const entry of day.entries) {
      const amount = amountOf(entry);
      if (amount) totals.add(entry.subscription.currency, amount);
    }
  }
  return totals.entries(preferred);
}

/** İlk `length` günün şerit verisi (indeks = bugünden sonraki gün sayısı). */
export function stripDays(days: readonly UpcomingDay[], length = 30): StripDay[] {
  return Array.from({ length }, (_, offset) => ({ count: days.find((item) => item.dayOffset === offset)?.entries.length ?? 0 }));
}
