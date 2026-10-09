import { type CreateSubscriptionPayload } from './subscriptionForm';
import { type SubscriptionEventDraft, type UpdatePayload } from './subscriptionEdit';
import { type SubscriptionRow } from './subscription';


/**
 * Abonelik yazma işlemleri (kuyruğa girebilen). Ekleme ve güncelleme RPC yükleri hazır
 * tutulur; böylece çevrimdışıyken yazılan işlem aynen gönderilebilir. Yerel satır
 * uygulaması cache'i ve bekleyen işlemleri ekranda birleştirir. I/O yoktur.
 */

/** Tasarruf olay tipleri: duraklatma ve iptal (Flutter ile aynı). */
export type SavingsEventType = 'PAUSED' | 'CANCELLED';

/** `savings_events` satırına yazılacak değer (tutarlar ondalık metin). */
export interface SavingsDraft {
  eventType: SavingsEventType;
  monthlyAmount: string;
  annualAmount: string;
  currency: string;
}

export type SubscriptionOperation =
  | { kind: 'create'; payload: CreateSubscriptionPayload }
  | {
      kind: 'update';
      payload: UpdatePayload;
      event: SubscriptionEventDraft | null;
      /** Duraklatma veya iptalde tasarruf kaydı (`savings_events`); diğer güncellemelerde null. */
      savings: SavingsDraft | null;
    };

/** Gönderilmemiş ekleme kayıtlarının kimlik öneki. Bu kayıtlar henüz sunucuda yoktur. */
export const PENDING_PREFIX = 'pending:';

/** Ekleme sırasında sunucu kimliği bilinmez; idempotency anahtarından türetilen geçici kimlik kullanılır. */
export function pendingCreateId(payload: CreateSubscriptionPayload): string {
  return `${PENDING_PREFIX}${payload.p_idempotency_key}`;
}

/** Yeni ekleme için yerel satır. Varsayılanlar veritabanı varsayılanlarıyla aynıdır. */
export function rowFromCreate(payload: CreateSubscriptionPayload): SubscriptionRow {
  return {
    id: pendingCreateId(payload),
    name: payload.p_name,
    amount: payload.p_amount,
    currency: payload.p_currency,
    billing_cycle: payload.p_billing_cycle,
    category: payload.p_category,
    status: payload.p_trial_end_date ? 'trial' : 'active',
    start_date: payload.p_start_date,
    next_renewal_date: payload.p_next_renewal_date,
    payment_method: payload.p_payment_method,
    notes: payload.p_notes,
    website: null,
    trial_end_date: payload.p_trial_end_date,
    trial_price_after: payload.p_trial_price_after,
    is_archived: false,
    notification_rules: [{ enabled: true, daysBefore: 3 }],
  };
}

/** Güncelleme yükünü mevcut satıra uygular. Her güncelleme arşivi kaldırır (RPC `is_archived` yazmaz). */
export function applyUpdateToRow(row: SubscriptionRow, payload: UpdatePayload): SubscriptionRow {
  return {
    ...row,
    name: payload.p_name,
    amount: payload.p_amount,
    currency: payload.p_currency,
    billing_cycle: payload.p_billing_cycle,
    start_date: payload.p_start_date,
    next_renewal_date: payload.p_next_renewal_date,
    category: payload.p_category,
    notes: payload.p_notes,
    payment_method: payload.p_payment_method,
    trial_end_date: payload.p_trial_end_date,
    trial_price_after: payload.p_trial_price_after,
    notification_rules: payload.p_notification_rules,
    status: payload.p_status,
    is_archived: false,
  };
}

/** Tek bir işlemi satır listesine uygular. Girdi değiştirilmez. */
export function applyOperation(rows: readonly SubscriptionRow[], operation: SubscriptionOperation): SubscriptionRow[] {
  if (operation.kind === 'create') return [rowFromCreate(operation.payload), ...rows];
  return rows.map((row) => (row.id === operation.payload.p_subscription_id ? applyUpdateToRow(row, operation.payload) : row));
}

/** Bekleyen işlemleri (sırayla) sunucu satırlarının üstüne bindirir. Girdi değiştirilmez. */
export function overlayPendingOperations(
  rows: readonly SubscriptionRow[],
  pending: readonly SubscriptionOperation[],
): SubscriptionRow[] {
  return pending.reduce<SubscriptionRow[]>((acc, operation) => applyOperation(acc, operation), [...rows]);
}
