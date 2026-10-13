import { readJsonStrict, removeJson } from '../../../core/storage/secureJsonStore';
import { registerSessionCleaner } from '../../../core/security/sessionCleanup';
import { clearNotificationLocalState } from './notificationLocalState';
export const DELETED_KEY = 'notifications.deleted-subscriptions';
export async function removedSubscriptionIds(): Promise<string[]> {
  const value = await readJsonStrict(DELETED_KEY);
  if (value === null) return [];
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) throw new Error('Bildirim silme kaydı okunamadı.');
  return value as string[];
}

/**
 * Çıkış ve hesap silmede silinen-hatırlatma listesini ve kullanıcının bildirim durumunu temizler. Planlı yerel
 * bildirimler hesap değişiminde `NotificationSync` tarafından iptal edilir.
 */
export async function clearReminderLocalData(userId: string): Promise<void> {
  await Promise.all([removeJson(DELETED_KEY), clearNotificationLocalState(userId)]);
}
registerSessionCleaner('reminders', (userId) => clearReminderLocalData(userId));
