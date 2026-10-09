import { supabase } from '../../../core/supabase/client';
import { DataWriteError, type DataWriteErrorOptions } from '../../../core/errors/dataWriteError';
import { type CreateSubscriptionPayload } from '../domain/subscriptionForm';
import { type SubscriptionEventDraft, type UpdatePayload } from '../domain/subscriptionEdit';

/**
 * Abonelik yazma çağrıları. Ekleme ve güncelleme idempotent RPC üzerinden yapılır; aynı
 * anahtarla tekrar gönderilen istek çift kayıt oluşturmaz ([API.md §4](../../../../../docs/reference/API.md)).
 */

export class SubscriptionWriteError extends DataWriteError {
  constructor(message: string, options: DataWriteErrorOptions = {}) {
    super(message, options);
    this.name = 'SubscriptionWriteError';
  }
}

/** Veritabanı hatasını kullanıcı mesajına çevirir. SQLSTATE 23514 = CHECK/kota ihlali. */
function messageFor(code: string | undefined): string {
  if (code === '23514') return 'Bilgileri kontrol edip tekrar dene. Limit aşılmış olabilir.';
  if (code === '42501') return 'Oturumun süresi dolmuş olabilir. Yeniden giriş yap.';
  if (code === 'P0002') return 'Abonelik bulunamadı. Listeyi yenileyip tekrar dene.';
  return 'Abonelik kaydedilemedi. Bağlantını kontrol edip tekrar dene.';
}

/** Kod yoksa ağ hatasıdır (yeniden denenir). 42501 oturum süresi: yeniden girişle düzelir, yeniden denenir. */
function errorFrom(error: { code?: string | null }): SubscriptionWriteError {
  const code = error.code || undefined;
  return new SubscriptionWriteError(messageFor(code), { code, retryable: !code || code === '42501' });
}

/** Yeni kaydın kimliğini döner (RPC satırın tamamını JSON olarak verir). */
export async function createSubscription(payload: CreateSubscriptionPayload): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_subscription_idempotent', payload);
  if (error) throw errorFrom(error);
  const id = (data as { id?: unknown } | null)?.id;
  return typeof id === 'string' ? id : null;
}

export async function updateSubscription(payload: UpdatePayload): Promise<void> {
  const { error } = await supabase.rpc('update_subscription_idempotent', payload);
  if (error) throw errorFrom(error);
}

/**
 * Kalıcı silme. Normal yaşam döngüsünde kullanılmaz (ADR 0006); yalnızca yanlış oluşturulmuş kayıt için
 * (DOMAIN §4). Satır RLS ile kullanıcının kendi kaydıyla sınırlıdır. Ödeme ve olay kayıtlarının FK/cascade
 * davranışı canlıda doğrulanmadığı için bağımlı kayıt hatası gelirse kullanıcıya genel mesaj gösterilir.
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').delete().eq('id', subscriptionId);
  if (error) throw errorFrom(error);
}

/**
 * Yaşam döngüsü olayı (`subscription_events`). RLS yalnızca kullanıcının kendi satırına
 * yazmasına izin verir. Güncelleme RPC'si olayı aynı işlemde yazmaz; bu yüzden çağıran
 * taraf güncellemeden sonra çağırır.
 */
export async function recordSubscriptionEvent(
  userId: string,
  subscriptionId: string,
  event: SubscriptionEventDraft,
): Promise<void> {
  const { error } = await supabase.from('subscription_events').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    event_type: event.eventType,
    payload: event.payload,
  });
  if (error) throw new SubscriptionWriteError('Olay kaydı yazılamadı.', { code: error.code || undefined, retryable: !error.code });
}
