import { Money } from '../../../core/domain/money';
import { type CivilDate, dayNumber, formatCivilDate } from '../../../core/time/calendar';
import { type SubscriptionFormValues, type SubscriptionFields } from './subscriptionForm';
import { type Subscription, type SubscriptionStatus } from './subscription';
import { daysFromRules } from './reminderRules';

/**
 * Düzenleme ve durum değişikliği yardımcıları. `update_subscription_idempotent` tüm
 * alanları ister: eksik alan null olarak yazılır. Bildirim kuralları da bu yüzden
 * her güncellemede okunup geri gönderilir (RPC null için `[]` yazar). I/O yoktur.
 */

/** Güncelleme RPC'si için alanlar. Düzenlemede tarihler zorunludur; durum değişikliğinde null olabilir. */
export type SubscriptionUpdateFields = Omit<SubscriptionFields, 'p_start_date' | 'p_next_renewal_date'> & {
  p_start_date: string | null;
  p_next_renewal_date: string | null;
};

export interface UpdatePayload extends SubscriptionUpdateFields {
  p_idempotency_key: string;
  p_subscription_id: string;
  p_notification_rules: unknown[];
  p_status: SubscriptionStatus;
}

/** Düzenleme formu için başlangıç değerleri. Eksik başlangıç tarihi bugüne düşer. */
export function formValuesFromSubscription(subscription: Subscription, today: CivilDate): SubscriptionFormValues {
  const trialEnd = subscription.trialEndDate;
  return {
    name: subscription.name,
    amount: subscription.amount.decimalString,
    currency: subscription.currency,
    billingCycle: subscription.billingCycle,
    category: subscription.category,
    startDate: subscription.startDate ?? today,
    nextRenewalDate: subscription.nextRenewalDate,
    notes: subscription.notes ?? '',
    paymentMethod: subscription.paymentMethod ?? '',
    isTrial: trialEnd !== null,
    trialEndDate: trialEnd,
    trialPrice: subscription.trialPriceAfter?.decimalString ?? '',
    initialPaymentStatus: 'unpaid',
    initialPaymentDate: today,
    reminderDays: daysFromRules(subscription.notificationRules),
  };
}

/** Mevcut kaydın alanlarını RPC biçimine çevirir; doğrulama yapılmaz (durum değişikliği için). */
export function subscriptionUpdateFields(subscription: Subscription): SubscriptionUpdateFields {
  return {
    p_name: subscription.name,
    p_amount: subscription.amount.decimalString,
    p_currency: subscription.currency,
    p_billing_cycle: subscription.billingCycle,
    p_start_date: subscription.startDate ? formatCivilDate(subscription.startDate) : null,
    p_next_renewal_date: subscription.nextRenewalDate ? formatCivilDate(subscription.nextRenewalDate) : null,
    p_category: subscription.category,
    p_notes: subscription.notes,
    p_payment_method: subscription.paymentMethod,
    p_trial_end_date: subscription.trialEndDate ? formatCivilDate(subscription.trialEndDate) : null,
    p_trial_price_after: subscription.trialPriceAfter ? subscription.trialPriceAfter.decimalString : null,
  };
}

/** Güncelleme yükü. `fields` doğrulanmış form alanı ya da mevcut kayıttan türetilmiş alanlardır. */
export function toUpdatePayload(
  subscription: Subscription,
  fields: SubscriptionUpdateFields,
  status: SubscriptionStatus,
  idempotencyKey: string,
  notificationRules: unknown[] = subscription.notificationRules,
): UpdatePayload {
  return {
    p_idempotency_key: idempotencyKey,
    p_subscription_id: subscription.id,
    ...fields,
    p_notification_rules: notificationRules,
    p_status: status,
  };
}

/** Kaydedilecek olay: `subscription_events` satırının `event_type` ve `payload` alanları. */
export interface SubscriptionEventDraft {
  eventType: 'PRICE_CHANGED' | 'STATUS_CHANGED' | 'RENEWAL_ADVANCED';
  payload: Record<string, string>;
}

/** Tutar veya para birimi değiştiyse PRICE_CHANGED üretir; aksi halde null. Döngü değişimi fiyat değildir. */
export function priceChangeEvent(
  before: Subscription,
  next: { amount: Money; currency: string },
): SubscriptionEventDraft | null {
  if (before.amount.equals(next.amount) && before.currency === next.currency) return null;
  return {
    eventType: 'PRICE_CHANGED',
    payload: {
      from_amount: before.amount.decimalString,
      from_currency: before.currency,
      to_amount: next.amount.decimalString,
      to_currency: next.currency,
    },
  };
}

export function statusChangeEvent(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
  extra: Record<string, string> = {},
): SubscriptionEventDraft | null {
  if (from === to) return null;
  return { eventType: 'STATUS_CHANGED', payload: { from_status: from, to_status: to, ...extra } };
}

/** Gecikmiş yenilemenin onaylanması: eski ve yeni tarih. Aynı tarihse olay yoktur. */
export function renewalAdvancedEvent(from: CivilDate, to: CivilDate): SubscriptionEventDraft | null {
  if (dayNumber(from) === dayNumber(to)) return null;
  return {
    eventType: 'RENEWAL_ADVANCED',
    payload: { from_date: formatCivilDate(from), to_date: formatCivilDate(to) },
  };
}

/**
 * Düzenleme sonrası durum: aktif kayda deneme eklenirse `trial`, deneme kapatılırsa
 * ve kayıt `trial` ise `active` olur. Diğer durumlara (duraklatıldı, iptal, süresi doldu, arşiv) dokunulmaz.
 */
export function statusAfterEdit(current: SubscriptionStatus, isTrial: boolean, trialEndDate: CivilDate | null): SubscriptionStatus {
  if (current === 'active' && isTrial && trialEndDate) return 'trial';
  if (current === 'trial' && !isTrial) return 'active';
  return current;
}
