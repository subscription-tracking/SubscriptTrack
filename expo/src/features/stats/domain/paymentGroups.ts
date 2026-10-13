import { formatMonthYear } from '../../../core/format/date';
import { localCivilDate, type PaymentEvent } from './paymentEvents';

/**
 * Ödeme geçmişi listesi: en yeni ödeme üstte; her ay için bir başlık satırı ("Ekim 2026"). I/O yoktur.
 */

export type PaymentListItem =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'row'; key: string; payment: PaymentEvent };

export function groupPaymentsByMonth(payments: readonly PaymentEvent[], timeZone: string): PaymentListItem[] {
  const sorted = [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  const items: PaymentListItem[] = [];
  let currentMonth: string | null = null;
  for (const payment of sorted) {
    const day = localCivilDate(payment.paidAt, timeZone);
    const monthKey = `${day.year}-${day.month}`;
    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      items.push({ kind: 'header', key: `h-${monthKey}`, label: formatMonthYear(day.year, day.month) });
    }
    items.push({ kind: 'row', key: payment.id, payment });
  }
  return items;
}
