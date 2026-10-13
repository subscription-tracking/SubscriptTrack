import type { QueueEntry } from './mutationQueue';
import type { SubscriptionRow } from './subscription';
import { SUBSCRIPTION_CATEGORIES, SUBSCRIPTION_STATUSES, SUBSCRIPTION_LIMITS } from './subscription';
import { Money } from '../../../core/domain/money';
import { parseCivilDate } from '../../../core/time/calendar';

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string';
const nullableText = (value: unknown) => value === null || text(value);
const money = (value: unknown) => {
  if (!text(value) && !(typeof value === 'number' && Number.isFinite(value))) return false;
  const parsed = Money.tryParse(String(value));
  return parsed !== null && parsed.minorUnits >= 0;
};
const subscriptionMoney = (value: unknown) => money(value) && Money.parse(String(value)).minorUnits <= SUBSCRIPTION_LIMITS.amountMaxMinorUnits;
const currency = (value: unknown) => text(value) && /^[A-Z]{3}$/.test(value);
const date = (value: unknown) => text(value) && parseCivilDate(value) !== null && Number(value.slice(0, 4)) > 0;
const nullableDate = (value: unknown) => value === null || date(value);
const nullableMoney = (value: unknown) => value === null || subscriptionMoney(value);
const cycle = (value: unknown) => text(value) && ['weekly', 'monthly', 'quarterly', 'yearly'].includes(value);
const category = (value: unknown) => text(value) && (SUBSCRIPTION_CATEGORIES as readonly string[]).includes(value);
const status = (value: unknown) => text(value) && (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
const fields = (value: RecordValue, names: string[], guard: (value: unknown) => boolean) => names.every((name) => guard(value[name]));

function payload(value: unknown): value is RecordValue {
  return object(value)
    && fields(value, ['p_idempotency_key', 'p_name', 'p_amount', 'p_currency', 'p_billing_cycle', 'p_category'], text)
    && fields(value, ['p_notes', 'p_payment_method'], nullableText)
    && fields(value, ['p_start_date', 'p_next_renewal_date', 'p_trial_end_date'], nullableDate)
    && subscriptionMoney(value.p_amount) && nullableMoney(value.p_trial_price_after)
    && currency(value.p_currency) && cycle(value.p_billing_cycle) && category(value.p_category);
}

function queueEntry(value: unknown, userId: string): value is QueueEntry {
  if (!object(value) || !text(value.id) || value.userId !== userId || !text(value.createdAt)
    || !Number.isFinite(Date.parse(value.createdAt)) || !['write', 'event', 'savings'].includes(String(value.stage))) return false;
  const op = value.op;
  if (object(op) && op.kind === 'delete' && object(op.payload)) {
    return value.stage === 'write' && op.payload.p_idempotency_key === value.id
      && Array.isArray(op.payload.p_subscription_ids) && op.payload.p_subscription_ids.length > 0 && op.payload.p_subscription_ids.length <= 1000
      && op.payload.p_subscription_ids.every((id) => text(id) && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id));
  }
  if (!object(op) || !payload(op.payload) || value.id !== op.payload.p_idempotency_key) return false;
  if (op.kind === 'create') return value.stage === 'write' && date(op.payload.p_start_date) && date(op.payload.p_next_renewal_date)
    && (op.attempted === undefined || typeof op.attempted === 'boolean')
    && (op.createdId === undefined || text(op.createdId))
    && (op.deleteAfterCreate === undefined || text(op.deleteAfterCreate))
    && (op.reminderRules === undefined || Array.isArray(op.reminderRules) && op.reminderRules.every((rule) => object(rule) && typeof rule.enabled === 'boolean' && typeof rule.daysBefore === 'number' && [0,1,3,7].includes(rule.daysBefore)));
  if (op.kind !== 'update' || !text(op.payload.p_subscription_id)
    || !status(op.payload.p_status)
    || !Array.isArray(op.payload.p_notification_rules)) return false;
  const event = op.event;
  if (event !== null && (!object(event) || !['PRICE_CHANGED', 'STATUS_CHANGED', 'RENEWAL_ADVANCED'].includes(String(event.eventType))
    || !object(event.payload) || !Object.values(event.payload).every(text))) return false;
  const savings = op.savings;
  return savings === null || (object(savings) && ['PAUSED', 'CANCELLED'].includes(String(savings.eventType))
    && fields(savings, ['monthlyAmount', 'annualAmount'], money) && currency(savings.currency));
}

function row(value: unknown): value is SubscriptionRow {
  return object(value) && fields(value, ['id', 'name', 'currency', 'billing_cycle', 'category', 'status'], text)
    && subscriptionMoney(value.amount) && currency(value.currency) && cycle(value.billing_cycle) && category(value.category) && status(value.status)
    && fields(value, ['payment_method', 'notes', 'website'], nullableText)
    && fields(value, ['start_date', 'next_renewal_date', 'trial_end_date'], nullableDate)
    && nullableMoney(value.trial_price_after)
    && (value.deleted_at === undefined || value.deleted_at === null || (text(value.deleted_at) && Number.isFinite(Date.parse(value.deleted_at))))
    && (value.is_archived === undefined || value.is_archived === null || typeof value.is_archived === 'boolean')
    && (value.notification_rules === undefined || value.notification_rules === null || Array.isArray(value.notification_rules));
}

/**
 * Bilinmeyen sürüm (ör. gelecekteki 3) ya da tanınmayan biçim. Ham değer hatayla taşınır:
 * önbellek çağıranı atıp yeniden çeker; kuyruk ham değeri karantinaya kopyalayıp boş kuyrukla devam eder.
 * Veri bu katmanda silinmez.
 */
export class UnsupportedStoredDataError extends Error {
  constructor(readonly raw: unknown) {
    super('Yerel abonelik verisi okunamadı. Kayıt korunuyor; tekrar dene.');
    this.name = 'UnsupportedStoredDataError';
  }
}

function entries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value; // Geçerli eski kayıtlar okunmaya devam eder.
  if (object(value) && (value.version === 1 || value.version === 2) && Array.isArray(value.entries)) return value.entries;
  throw new UnsupportedStoredDataError(value);
}

export function decodeQueue(value: unknown, userId: string): QueueEntry[] {
  if (value === null) return [];
  const result = entries(value);
  if (!result.every((item) => queueEntry(item, userId))) throw new Error('Bekleyen işlemler doğrulanamadı. Kayıt korunuyor; tekrar dene.');
  return result;
}

export function decodeCache(value: unknown): SubscriptionRow[] | null {
  if (value === null) return null;
  const result = entries(value);
  if (!result.every(row)) throw new Error('Yerel abonelik listesi doğrulanamadı.');
  return result;
}
