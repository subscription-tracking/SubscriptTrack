import { Money } from '../../../core/domain/money';
import { type CivilDate, formatCivilDate } from '../../../core/time/calendar';
import { type CreateSubscriptionPayload, type SubscriptionFormValues, toSubscriptionFields } from '../domain/subscriptionForm';
import {
  priceChangeEvent,
  renewalAdvancedEvent,
  statusChangeEvent,
  subscriptionUpdateFields,
  toUpdatePayload,
} from '../domain/subscriptionEdit';
import { advancedRenewalDate, isOverdueRenewal } from '../domain/renewalOverdue';
import { rulesFromDays } from '../domain/reminderRules';
import { canTransition } from '../domain/statusTransitions';
import { savingsDraftFor } from '../../savings/domain/savingsSummary';
import { type Subscription, type SubscriptionStatus, subscriptionFromRow } from '../domain/subscription';
import { PENDING_PREFIX } from '../domain/subscriptionOperations';
import { resolveRows, type SubmitResult, submitOperation } from './subscriptionSync';
import { SubscriptionWriteError } from './subscriptionWriteRepository';

/**
 * Abonelik yazma iş akışları. Her iş önce kaydın yerel görünümünü alır (çevrimiçiyse
 * güncel sunucu verisi, bekleyen yazımlar üstünde), sonra işlemi `submitOperation`'a verir.
 * Sonuç `sent` (sunucuya gitti) ya da `queued` (kuyrukta, bağlantı gelince gönderilecek).
 */

async function currentOrThrow(userId: string, subscriptionId: string): Promise<Subscription> {
  const rows = await resolveRows(userId);
  const row = rows.find((item) => item.id === subscriptionId);
  if (!row) throw new SubscriptionWriteError('Abonelik bulunamadı. Listeyi yenileyip tekrar dene.');
  if (row.id.startsWith(PENDING_PREFIX)) {
    throw new SubscriptionWriteError('Bu abonelik henüz gönderilmedi. Bağlantı gelince düzenleyebilirsin.');
  }
  return subscriptionFromRow(row);
}

/** Yeni abonelik. Çevrimdışıyken de yerelde görünür ve bağlantı gelince gönderilir. */
export function submitCreate(userId: string, payload: CreateSubscriptionPayload): Promise<SubmitResult> {
  return submitOperation(userId, { kind: 'create', payload });
}

/** Doğrulanmış düzenleme formunu kaydeder. Fiyat (tutar veya para birimi) değiştiyse olay yazar. */
export async function saveSubscriptionEdit(input: {
  userId: string;
  subscriptionId: string;
  values: SubscriptionFormValues;
  idempotencyKey: string;
}): Promise<SubmitResult> {
  const current = await currentOrThrow(input.userId, input.subscriptionId);
  const fields = toSubscriptionFields(input.values);
  const payload = toUpdatePayload(current, fields, current.status, input.idempotencyKey, rulesFromDays(input.values.reminderDays));
  const event = priceChangeEvent(current, { amount: Money.parse(fields.p_amount), currency: fields.p_currency });
  return submitOperation(input.userId, { kind: 'update', payload, event, savings: null });
}

/** Durum değişikliği (durdur, devam, iptal, arşivle, geri al). Geçiş kuralına uymayan istek reddedilir. */
export async function changeSubscriptionStatus(input: {
  userId: string;
  subscriptionId: string;
  to: SubscriptionStatus;
  idempotencyKey: string;
  /** İptal akışında iptal ve erişim tarihleri (olay payload'ına yazılır). */
  eventExtra?: Record<string, string>;
}): Promise<SubmitResult> {
  const current = await currentOrThrow(input.userId, input.subscriptionId);
  if (!canTransition(current.status, input.to)) {
    throw new SubscriptionWriteError('Bu durum değişikliği şu anki durumdan yapılamaz.');
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
export async function confirmOverdueRenewal(input: {
  userId: string;
  subscriptionId: string;
  today: CivilDate;
  idempotencyKey: string;
}): Promise<SubmitResult> {
  const current = await currentOrThrow(input.userId, input.subscriptionId);
  if (!isOverdueRenewal(current, input.today)) {
    throw new SubscriptionWriteError('Yenileme tarihi zaten ileride. Listeyi yenileyip tekrar bak.');
  }
  const next = advancedRenewalDate(current, input.today);
  if (!next || !current.nextRenewalDate) throw new SubscriptionWriteError('Yeni yenileme tarihi hesaplanamadı.');

  const fields = { ...subscriptionUpdateFields(current), p_next_renewal_date: formatCivilDate(next) };
  const payload = toUpdatePayload(current, fields, current.status, input.idempotencyKey);
  const event = renewalAdvancedEvent(current.nextRenewalDate, next);
  return submitOperation(input.userId, { kind: 'update', payload, event, savings: null });
}
