import { Money } from '../../../core/domain/money';
import { type CivilDate, formatCivilDate } from '../../../core/time/calendar';
import { type CreateSubscriptionPayload, type SubscriptionFormValues, toSubscriptionFields } from '../domain/subscriptionForm';
import {
  priceChangeEvent,
  renewalAdvancedEvent,
  statusAfterEdit,
  statusChangeEvent,
  subscriptionUpdateFields,
  toUpdatePayload,
} from '../domain/subscriptionEdit';
import { advancedRenewalDate, isRenewalDue } from '../domain/renewalOverdue';
import { rulesFromDays } from '../domain/reminderRules';
import { canTransition } from '../domain/statusTransitions';
import { savingsDraftFor } from '../../savings/domain/savingsSummary';
import { type Subscription, type SubscriptionStatus, type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { PENDING_PREFIX } from '../domain/subscriptionOperations';

/**
 * Abonelik yazma iş akışları. Her iş önce kaydın yerel görünümünü alır (çevrimiçiyse
 * güncel sunucu verisi, bekleyen yazımlar üstünde), sonra işlemi `submitOperation`'a verir.
 * Sonuç `sent` (sunucuya gitti) ya da `queued` (kuyrukta, bağlantı gelince gönderilecek).
 */

import type { SubscriptionOperation } from '../domain/subscriptionOperations';
import type { SubmitResult } from '../domain/subscriptionSyncTypes';

export interface SubscriptionMutationDependencies {
  resolveRows: (userId: string) => Promise<SubscriptionRow[]>;
  submitOperation: (userId: string, op: SubscriptionOperation) => Promise<SubmitResult>;
  recordPayment: (input: { idempotencyKey: string; subscriptionId: string; amount: string; currency: string; paidAt: Date }) => Promise<void>;
  confirmAtomicRenewal: (input: { idempotencyKey: string; timeZone?: string }, current: { id: string; nextRenewalDate: CivilDate }, next: CivilDate, today: CivilDate) => Promise<void>;
  atomicRenewalEnabled: () => boolean;
  now: () => Date;
  writeError: (message: string) => Error;
}

export function createSubscriptionMutations(dependencies: SubscriptionMutationDependencies) {
  const { resolveRows, submitOperation, recordPayment, confirmAtomicRenewal, atomicRenewalEnabled, now, writeError } = dependencies;
  async function currentOrThrow(userId: string, subscriptionId: string): Promise<Subscription> {
    const rows = await resolveRows(userId);
    const row = rows.find((item) => item.id === subscriptionId);
    if (!row) throw writeError('Abonelik bulunamadı. Listeyi yenileyip tekrar dene.');
    if (row.id.startsWith(PENDING_PREFIX)) {
      throw writeError('Bu abonelik henüz gönderilmedi. Bağlantı gelince düzenleyebilirsin.');
    }
    return subscriptionFromRow(row);
  }

  /** Yeni abonelik. Çevrimdışıyken de yerelde görünür ve bağlantı gelince gönderilir. */
  async function submitCreate(userId: string, payload: CreateSubscriptionPayload, reminderRules?: { enabled: boolean; daysBefore: number }[]): Promise<SubmitResult> {
    const result = await submitOperation(userId, { kind: 'create', payload, ...(reminderRules ? { reminderRules } : {}) });
    return { ...result, ...(reminderRules ? { remindersManaged: true as const } : {}) };
  }

  /** Doğrulanmış düzenleme formunu kaydeder. Fiyat (tutar veya para birimi) değiştiyse olay yazar. */
  async function saveSubscriptionEdit(input: {
    userId: string;
    subscriptionId: string;
    values: SubscriptionFormValues;
    idempotencyKey: string;
  }): Promise<SubmitResult> {
    const current = await currentOrThrow(input.userId, input.subscriptionId);
    const fields = toSubscriptionFields(input.values);
    const status = statusAfterEdit(current.status, input.values.isTrial, input.values.trialEndDate);
    const payload = toUpdatePayload(current, fields, status, input.idempotencyKey, rulesFromDays(input.values.reminderDays));
    const event = priceChangeEvent(current, { amount: Money.parse(fields.p_amount), currency: fields.p_currency });
    return submitOperation(input.userId, { kind: 'update', payload, event, savings: null });
  }

  /** Durum değişikliği (durdur, devam, iptal, arşivle, geri al). Geçiş kuralına uymayan istek reddedilir. */
  async function changeSubscriptionStatus(input: {
    userId: string;
    subscriptionId: string;
    to: SubscriptionStatus;
    idempotencyKey: string;
    /** İptal akışında iptal ve erişim tarihleri (olay payload'ına yazılır). */
    eventExtra?: Record<string, string>;
  }): Promise<SubmitResult> {
    const current = await currentOrThrow(input.userId, input.subscriptionId);
    if (!canTransition(current.status, input.to)) {
      throw writeError('Bu durum değişikliği şu anki durumdan yapılamaz.');
    }
    const payload = toUpdatePayload(current, subscriptionUpdateFields(current), input.to, input.idempotencyKey);
    const event = statusChangeEvent(current.status, input.to, input.eventExtra);
    const savingsType = input.to === 'paused' ? 'PAUSED' : input.to === 'cancelled' ? 'CANCELLED' : null;
    const savings = savingsType ? savingsDraftFor(current, savingsType) : null;
    return submitOperation(input.userId, { kind: 'update', payload, event, savings });
  }

  /**
   * Gecikmiş yenilemeyi onaylar ("yenilendi"): tarih, bugün veya sonrasındaki ilk döngü
   * tarihine ilerler. Kayıt hâlâ gecikmiş değilse yazılmaz.
   */
  async function confirmOverdueRenewal(input: {
    userId: string;
    subscriptionId: string;
    today: CivilDate;
    timeZone?: string;
    idempotencyKey: string;
  }): Promise<SubmitResult> {
    const current = await currentOrThrow(input.userId, input.subscriptionId);
    if (!isRenewalDue(current, input.today)) {
      throw writeError('Yenileme tarihi zaten ileride. Listeyi yenileyip tekrar bak.');
    }
    const next = advancedRenewalDate(current, input.today);
    if (!next || !current.nextRenewalDate) throw writeError('Yeni yenileme tarihi hesaplanamadı.');

    if (atomicRenewalEnabled()) {
      await confirmAtomicRenewal(input, { id: current.id, nextRenewalDate: current.nextRenewalDate }, next, input.today);
      return { status: 'sent', eventSaved: true };
    }

    // Flutter's "Ödendi ve yenilendi" action records a manual payment before
    // moving the subscription date. Reuse the operation key across the separate
    // idempotency paths so retrying either request cannot duplicate its write.
    await recordPayment({
      idempotencyKey: input.idempotencyKey,
      subscriptionId: current.id,
      amount: current.amount.decimalString,
      currency: current.currency,
      paidAt: now(),
    });

    const fields = { ...subscriptionUpdateFields(current), p_next_renewal_date: formatCivilDate(next) };
    const payload = toUpdatePayload(current, fields, current.status, input.idempotencyKey);
    const event = renewalAdvancedEvent(current.nextRenewalDate, next);
    return submitOperation(input.userId, { kind: 'update', payload, event, savings: null });
  }

  return { submitCreate, saveSubscriptionEdit, changeSubscriptionStatus, confirmOverdueRenewal };
}
