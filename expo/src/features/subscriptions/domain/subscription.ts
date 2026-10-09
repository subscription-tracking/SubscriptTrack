import { Money } from '../../../core/domain/money';
import { type BillingCycle, type CivilDate, daysBetween, parseCivilDate } from '../../../core/time/calendar';

/**
 * Abonelik alan modeli ve saf kurallar. Flutter `subscription_models.dart` ile
 * aynı anlamdadır ([DOMAIN.md](../../../../../docs/product/DOMAIN.md)). I/O yoktur.
 */

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'paused', 'cancelled', 'expired', 'archived'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_CATEGORIES = [
  'streaming',
  'music',
  'gaming',
  'software',
  'cloud',
  'fitness',
  'news',
  'food',
  'education',
  'other',
] as const;
export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: 'Video & Dizi',
  music: 'Müzik',
  gaming: 'Oyun',
  software: 'Yazılım',
  cloud: 'Bulut Depolama',
  fitness: 'Spor & Sağlık',
  news: 'Haber & Dergi',
  food: 'Yemek',
  education: 'Eğitim',
  other: 'Diğer',
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: 'Üç aylık',
  yearly: 'Yıllık',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Deneme',
  active: 'Aktif',
  paused: 'Duraklatıldı',
  cancelled: 'İptal edildi',
  expired: 'Süresi doldu',
  archived: 'Arşiv',
};

/** Veritabanı satırı (`subscriptions` tablosu, [DATA_MODEL §2.1](../../../../../docs/reference/DATA_MODEL.md)). */
export interface SubscriptionRow {
  id: string;
  name: string;
  amount: string | number;
  currency: string;
  billing_cycle: string;
  category: string;
  status: string;
  start_date: string | null;
  next_renewal_date: string | null;
  payment_method: string | null;
  notes: string | null;
  website: string | null;
  trial_end_date: string | null;
  trial_price_after: string | number | null;
  is_archived?: boolean | null;
  notification_rules?: unknown[] | null;
}

export interface Subscription {
  id: string;
  name: string;
  amount: Money;
  currency: string;
  billingCycle: BillingCycle;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  startDate: CivilDate | null;
  nextRenewalDate: CivilDate | null;
  paymentMethod: string | null;
  notes: string | null;
  website: string | null;
  trialEndDate: CivilDate | null;
  trialPriceAfter: Money | null;
  /** Bildirim kuralları (jsonb). Güncelleme RPC'si null alırsa sıfırlar; bu yüzden okunup geri yazılır. */
  notificationRules: unknown[];
}

/** Bilinmeyen değerler için güvenli varsayılanlar (Flutter `fromKey` ile aynı mantık). */
function asCycle(value: string): BillingCycle {
  return (['weekly', 'monthly', 'quarterly', 'yearly'] as const).includes(value as BillingCycle)
    ? (value as BillingCycle)
    : 'monthly';
}

function asCategory(value: string): SubscriptionCategory {
  return (SUBSCRIPTION_CATEGORIES as readonly string[]).includes(value) ? (value as SubscriptionCategory) : 'other';
}

function asStatus(value: string): SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value) ? (value as SubscriptionStatus) : 'active';
}

function optionalMoney(value: string | number | null): Money | null {
  return value === null || value === undefined ? null : Money.fromJson(value);
}

export function subscriptionFromRow(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: Money.fromJson(row.amount),
    currency: row.currency,
    billingCycle: asCycle(row.billing_cycle),
    category: asCategory(row.category),
    // Flutter ile aynı: is_archived doğruysa durum ne olursa olsun arşivdir.
    status: row.is_archived ? 'archived' : asStatus(row.status),
    startDate: row.start_date ? parseCivilDate(row.start_date) : null,
    nextRenewalDate: row.next_renewal_date ? parseCivilDate(row.next_renewal_date) : null,
    paymentMethod: row.payment_method,
    notes: row.notes,
    website: row.website,
    trialEndDate: row.trial_end_date ? parseCivilDate(row.trial_end_date) : null,
    trialPriceAfter: optionalMoney(row.trial_price_after),
    notificationRules: Array.isArray(row.notification_rules) ? row.notification_rules : [],
  };
}

/**
 * Aylık eşdeğer tutar (PRODUCT §6.3): haftalık ×52/12, üç aylık ÷3, yıllık ÷12.
 * Görüntü ve toplamlar için; kalıcı veride kullanılmaz.
 */
export function monthlyEquivalent(subscription: Subscription): Money {
  switch (subscription.billingCycle) {
    case 'weekly':
      return subscription.amount.multiply(52 / 12);
    case 'quarterly':
      return subscription.amount.divide(3);
    case 'yearly':
      return subscription.amount.divide(12);
    default:
      return subscription.amount;
  }
}

/** Yenilemeye kalan tam gün sayısı. Negatif değer geçmiş tarihi gösterir. */
export function daysUntilRenewal(subscription: Subscription, today: CivilDate): number | null {
  if (!subscription.nextRenewalDate) return null;
  return daysBetween(today, subscription.nextRenewalDate);
}
