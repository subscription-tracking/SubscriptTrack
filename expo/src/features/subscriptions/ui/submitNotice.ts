import { type SubmitResult } from '../data/subscriptionSync';

/** Yazım sonucunu kullanıcıya bildirir. Kuyruğa girdiyse ya da geçmiş kaydı eksikse uyarır. */
export function submitNotice(result: SubmitResult): { message: string; tone: 'default' | 'primary' } | null {
  if (result.status === 'queued') {
    return { message: 'Bağlantı yok. Değişiklik bağlantı gelince gönderilecek.', tone: 'default' };
  }
  if (!result.eventSaved) {
    return { message: 'Kaydedildi, ancak geçmiş kaydı yazılamadı.', tone: 'default' };
  }
  return null;
}
