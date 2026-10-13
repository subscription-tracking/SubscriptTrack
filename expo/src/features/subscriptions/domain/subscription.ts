import { Money } from '../../../core/domain/money';
import { type BillingCycle, type CivilDate, daysBetween, parseCivilDate } from '../../../core/time/calendar';

/**
 * Abonelik alan modeli ve saf kurallar. Flutter `subscription_models.dart` ile
 * aynı anlamdadır ([DOMAIN.md](../../../../../docs/product/DOMAIN.md)). I/O yoktur.
 */

export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'paused', 'cancelled', 'expired', 'archived'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Live API CHECK for `subscriptions.amount` (migration 033), in exact minor units. */
export const SUBSCRIPTION_LIMITS = {
  amountMaxMinorUnits: 100_000_000_000,
} as const;

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
  streaming: 'Video ve dizi',
  music: 'Müzik',
  gaming: 'Oyun',
  software: 'Yazılım',
  cloud: 'Bulut depolama',
  fitness: 'Spor ve sağlık',
  news: 'Haber ve dergi',
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
  deleted_at?: string | null;
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
  return monthlyAmount(subscription.amount, subscription.billingCycle);
}

/** Tutarın aylık eşdeğeri (haftalık ×52/12, üç aylık ÷3, yıllık ÷12). Form önizlemesi ve toplamlar ortak kullanır. */
export function monthlyAmount(amount: Money, cycle: BillingCycle): Money {
  switch (cycle) {
    case 'weekly':
      return amount.multiply(52 / 12);
    case 'quarterly':
      return amount.divide(3);
    case 'yearly':
      return amount.divide(12);
    default:
      return amount;
  }
}

/**
 * Yıllık eşdeğer tutar: haftalık ×52, aylık ×12, üç aylık ×4, yıllık ×1. Tam sayı minör birim
 * çarpımıdır; aylık eşdeğerin yuvarlanmış halinin ×12'si değildir (yıllık 100,00 → 100,00).
 */
export function annualEquivalent(subscription: Subscription): Money {
  return annualAmount(subscription.amount, subscription.billingCycle);
}

/** Tutarın yıllık eşdeğeri. */
export function annualAmount(amount: Money, cycle: BillingCycle): Money {
  switch (cycle) {
    case 'weekly':
      return amount.multiply(52);
    case 'quarterly':
      return amount.multiply(4);
    case 'yearly':
      return amount;
    default:
      return amount.multiply(12);
  }
}

/** Yenilemeye kalan tam gün sayısı. Negatif değer geçmiş tarihi gösterir. */
export function daysUntilRenewal(subscription: Subscription, today: CivilDate): number | null {
  if (!subscription.nextRenewalDate) return null;
  return daysBetween(today, subscription.nextRenewalDate);
}
