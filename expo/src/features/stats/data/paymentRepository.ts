import { env } from '../../../core/config/env';
import { supabase } from '../../../core/supabase/client';
import { DataWriteError } from '../../../core/errors/dataWriteError';
import { type PaymentEvent, paymentFromRow } from '../domain/paymentEvents';

/**
 * Ödeme kayıtları (`payment_events`). Ekleme `record_payment_idempotent` RPC'siyle yapılır;
 * çevrimdışı kuyruğa alınmaz: ödeme tarihi ve tutarı kullanıcının o anki girdisidir ve
 * sonradan gönderilmesi yanlış dönemi yazabilir. Silme ve düzenleme RLS ile kendi satırlarına sınırlıdır.
 */

interface PaymentRow {
  id: string;
  subscription_id: string | null;
  amount: string | number;
  currency: string;
  paid_at: string;
  status: string | null;
}

const PAGE_SIZE = 500;

/**
 * Tüm ödeme geçmişini sayfalayarak çeker. `id` ikincil sıralama olarak kullanılır; aynı `paid_at`
 * değerine sahip kayıtlar sayfa sınırında kaybolmaz ya da tekrarlanmaz. Eksik veriyle toplam hesaplanmaz.
 */
export async function fetchPayments(): Promise<PaymentEvent[]> {
  const rows: PaymentRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('payment_events')
      .select('id, subscription_id, amount, currency, paid_at, status')
      .order('paid_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) throw new DataWriteError('Ödeme geçmişi yüklenemedi. Bağlantını kontrol edip tekrar dene.');
    rows.push(...(data as PaymentRow[]));
    if (data.length < PAGE_SIZE) break;
  }
  return rows.map(paymentFromRow);
}

export async function recordPayment(input: {
  idempotencyKey: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  paidAt: Date;
}): Promise<void> {
  const { error } = await supabase.rpc('record_payment_idempotent', {
    p_idempotency_key: input.idempotencyKey,
    p_subscription_id: input.subscriptionId,
    p_amount: input.amount,
    p_currency: input.currency,
    p_paid_at: input.paidAt.toISOString(),
  });
  if (error) throw paymentError(error.code);
}

/** Tutar ve tarih düzenlenir; para birimi aboneliğe bağlıdır ve değişmez. RLS yalnızca kendi satırını günceller. */
export async function updatePayment(input: { id: string; amount: string; paidAt: Date }): Promise<void> {
  const { data, error } = await supabase
    .from('payment_events')
    .update({ amount: input.amount, paid_at: input.paidAt.toISOString() })
    .eq('id', input.id)
    .select('id');
  if (error) throw new DataWriteError('Ödeme kaydı güncellenemedi. Bağlantını kontrol edip tekrar dene.', { code: error.code || undefined, retryable: !error.code });
  if (!data?.length) throw new DataWriteError('Ödeme kaydı bulunamadı. Listeyi yenileyip tekrar dene.');
}

export async function deletePayment(id: string): Promise<void> {
  const { data, error } = await supabase.from('payment_events').delete().eq('id', id).select('id');
  if (error) throw new DataWriteError('Ödeme kaydı silinemedi. Tekrar dene.', { code: error.code || undefined });
  if (!data?.length) throw new DataWriteError('Ödeme kaydı bulunamadı. Listeyi yenileyip tekrar dene.');
}

/**
 * Ertelenmiş ilk ödeme (`record_deferred_payment_idempotent`, migration 037): sahiplik ve idempotency
 * kontrolü `PAID` yazımla aynıdır. Ertelenen kayıt toplamlara girmez; yalnızca geçmişte ertelendi olarak görünür.
 */
export async function recordDeferredPayment(input: {
  userId: string;
  idempotencyKey: string;
  subscriptionId: string;
  amount: string;
  currency: string;
  paidAt: Date;
  deferredUntil: string;
}): Promise<void> {
  if (env.idempotentDeferredEnabled) {
    const { error } = await supabase.rpc('record_deferred_payment_idempotent', {
      p_idempotency_key: input.idempotencyKey,
      p_subscription_id: input.subscriptionId,
      p_amount: input.amount,
      p_currency: input.currency,
      p_paid_at: input.paidAt.toISOString(),
      p_deferred_until: input.deferredUntil,
    });
    if (error) throw paymentError(error.code);
    return;
  }
  // 037 canlıya uygulanana kadar eski yol: anahtar bu yolda kullanılmaz, yeniden denemede çift kayıt riski vardır.
  const { error } = await supabase.from('payment_events').insert({
    user_id: input.userId,
    subscription_id: input.subscriptionId,
    amount: input.amount,
    currency: input.currency,
    paid_at: input.paidAt.toISOString(),
    source: 'manual',
    status: 'DEFERRED',
    deferred_until: input.deferredUntil,
  });
  if (error) throw paymentError(error.code);
}

function paymentError(code: string | undefined): DataWriteError {
  if (code === 'P0002') return new DataWriteError('Abonelik bulunamadı. Listeyi yenileyip tekrar dene.', { code });
  if (code === '42501') return new DataWriteError('Oturumun süresi dolmuş olabilir. Yeniden giriş yap.', { code });
  return new DataWriteError('Ödeme kaydedilemedi. Bağlantını kontrol edip tekrar dene.', { code: code || undefined, retryable: !code });
}
