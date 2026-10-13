import { Money } from '../../../core/domain/money';
import { type CivilDate, addDays, dayNumber, daysBetween, daysInMonth } from '../../../core/time/calendar';
import { totalForMonth, type PaymentEvent } from '../../stats/domain/paymentEvents';
import { compareByRenewal } from '../../subscriptions/domain/activeSelectors';
import { isRenewalDue } from '../../subscriptions/domain/renewalOverdue';
import type { Subscription } from '../../subscriptions/domain/subscription';

/**
 * Ana sayfa "bu ay" özeti, dikkat gerektirenler ve yaklaşan günler. Para birimleri birbirine
 * çevrilmez; toplamlar para birimi başına tam sayı (minor unit) tutulur. I/O yoktur.
 */

export interface MonthPaymentSummary {
  currency: string;
  /** Bu takvim ayında ödendi olarak kaydedilen tutar. */
  paid: Money;
  /** Bu ayın sonuna kadar vadesi olan (gecikmiş ve bugün dahil) ödenmemiş yenilemeler. */
  remaining: Money;
  /** `paid + remaining`. */
  total: Money;
}

/** Aktif kaydın bu ayın sonuna kadar kaç kez ödenmesi gerekir (haftalıkta birden çok olabilir). */
function dueCountThisMonth(subscription: Subscription, today: CivilDate): number {
  const next = subscription.nextRenewalDate;
  if (!next) return 0;
  const monthEnd: CivilDate = { year: today.year, month: today.month, day: daysInMonth(today.year, today.month) };
  const endDay = dayNumber(monthEnd);
  if (dayNumber(next) > endDay) return 0;
  if (subscription.billingCycle !== 'weekly') return 1;
  // Haftalık: gecikmişse bugün ödenen bir kez; ayın kalanındaki her 7 günlük vade ayrıca sayılır.
  let count = 1;
  let cursor = addDays(next, 7);
  while (dayNumber(cursor) <= endDay) {
    count += 1;
    cursor = addDays(cursor, 7);
  }
  return count;
}

/**
 * Para birimi başına bu ayın ödenen/kalan/toplam tutarı. Tercih edilen para birimi başa gelir; kalanlar
 * alfabetik sıralanır. Hiç tutar yoksa boş dizi döner.
 */
export function monthPaymentSummary(
  active: readonly Subscription[],
  payments: readonly PaymentEvent[],
  today: CivilDate,
  now: Date,
  timeZone: string,
  preferredCurrency?: string,
): MonthPaymentSummary[] {
  const remaining = new Map<string, Money>();
  for (const subscription of active) {
    const count = dueCountThisMonth(subscription, today);
    if (count === 0) continue;
    const current = remaining.get(subscription.currency) ?? Money.zero;
    remaining.set(subscription.currency, current.add(subscription.amount.multiply(count)));
  }
  const currencies = new Set<string>(remaining.keys());
  for (const event of payments) {
    if (event.status === 'PAID' && totalForMonth([event], event.currency, now, timeZone) > 0) currencies.add(event.currency);
  }
  const ordered = [...currencies].sort((a, b) => {
    if (a === preferredCurrency) return -1;
    if (b === preferredCurrency) return 1;
    return a.localeCompare(b);
  });
  return ordered.map((currency) => {
    const paid = Money.fromMinorUnits(totalForMonth(payments, currency, now, timeZone));
    const left = remaining.get(currency) ?? Money.zero;
    return { currency, paid, remaining: left, total: paid.add(left) };
  });
}

export interface AttentionItem {
  subscription: Subscription;
  /** 0: bugün vadeli; pozitif: gecikmiş gün sayısı. */
  daysOverdue: number;
}

/** Vadesi bugün gelmiş ya da geçmiş aktif/deneme kayıtlar; en eski vade önce. */
export function attentionItems(subscriptions: readonly Subscription[], today: CivilDate): AttentionItem[] {
  return subscriptions
    .filter((subscription) => isRenewalDue(subscription, today))
    .sort(compareByRenewal)
    .map((subscription) => ({
      subscription,
      daysOverdue: subscription.nextRenewalDate ? Math.max(0, daysBetween(subscription.nextRenewalDate, today)) : 0,
    }));
}

export type UpcomingKind = 'renewal' | 'trialEnd';

export interface UpcomingEntry {
  kind: UpcomingKind;
  subscription: Subscription;
}

export interface UpcomingDay {
  date: CivilDate;
  /** Bugüne göre gün farkı (≥1). */
  dayOffset: number;
  entries: UpcomingEntry[];
}

/**
 * Önümüzdeki `days` gün (yarından başlayarak) içinde vadesi gelecek yenilemeler ve deneme bitişleri, günlere
 * gruplu. Bugün ve geçmiş vadeler `attentionItems` altında gösterilir; burada yer almaz.
 */
export function upcomingByDay(subscriptions: readonly Subscription[], today: CivilDate, days = 14): UpcomingDay[] {
  const byDay = new Map<number, UpcomingDay>();
  const push = (date: CivilDate | null, kind: UpcomingKind, subscription: Subscription) => {
    if (!date) return;
    const offset = daysBetween(today, date);
    if (offset < 1 || offset > days) return;
    const key = dayNumber(date);
    const group = byDay.get(key) ?? { date, dayOffset: offset, entries: [] };
    group.entries.push({ kind, subscription });
    byDay.set(key, group);
  };
  for (const subscription of subscriptions) {
    if (subscription.status === 'active') push(subscription.nextRenewalDate, 'renewal', subscription);
    if (subscription.status === 'trial') push(subscription.trialEndDate ?? subscription.nextRenewalDate, 'trialEnd', subscription);
  }
  return [...byDay.values()]
    .sort((a, b) => a.dayOffset - b.dayOffset)
    .map((group) => ({ ...group, entries: [...group.entries].sort((a, b) => compareByRenewal(a.subscription, b.subscription)) }));
}
