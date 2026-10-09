import { formatCivilDate, type CivilDate } from '../../../core/time/calendar';
import { type Subscription } from '../../subscriptions/domain/subscription';

/**
 * Dışa aktarma CSV'si ([Flutter subscription_csv_exporter](../../../../../mobile/lib/features/settings/domain/subscription_csv_exporter.dart) ile aynı).
 * 11 alanlı kanonik şema; metin alanları formül enjeksiyonuna karşı etkisizleştirilir (başına `'`).
 * Tutar ve tarih sütunları olduğu gibi yazılır. I/O yoktur.
 */

export const CSV_HEADERS = [
  'name',
  'amount',
  'currency',
  'billing_cycle',
  'next_renewal_date',
  'category',
  'status',
  'notes',
  'payment_method',
  'trial_end_date',
  'trial_price_after',
] as const;

const TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

/** Formül olarak yorumlanabilecek metnin başına `'` ekler. */
export function neutralizeFormula(value: string): string {
  return value.length > 0 && TRIGGERS.includes(value[0]) ? `'${value}` : value;
}

/** Tek CSV alanı: çift tırnakla sarılır; metin alanlarında formül koruması uygulanır. */
export function csvField(value: string, text = true): string {
  const safe = text ? neutralizeFormula(value) : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function dateField(day: CivilDate | null): string {
  return day ? formatCivilDate(day) : '';
}

export function buildSubscriptionCsv(subscriptions: readonly Subscription[]): string {
  const lines: string[] = [CSV_HEADERS.map((header) => csvField(header, false)).join(',')];
  for (const subscription of subscriptions) {
    lines.push(
      [
        csvField(subscription.name),
        csvField(subscription.amount.decimalString, false),
        csvField(subscription.currency),
        csvField(subscription.billingCycle),
        csvField(dateField(subscription.nextRenewalDate), false),
        csvField(subscription.category),
        csvField(subscription.status),
        csvField(subscription.notes ?? ''),
        csvField(subscription.paymentMethod ?? ''),
        csvField(dateField(subscription.trialEndDate), false),
        csvField(subscription.trialPriceAfter?.decimalString ?? '', false),
      ].join(','),
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}
