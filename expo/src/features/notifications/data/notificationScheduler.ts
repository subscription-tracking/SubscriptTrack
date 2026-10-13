import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import { isCatchUpIdentifier, isPlannedIdentifier, SNOOZE_IDENTIFIER_PREFIX, REMINDER_LIMIT, type PlannedReminder } from '../domain/reminderPlanner';
import { writeJson } from '../../../core/storage/secureJsonStore';
import { DELETED_KEY, removedSubscriptionIds } from './removedReminders';
import { notificationSerial } from './notificationSerial';
import { notificationsModule, normalizedPermission, type NotificationsModule, ANDROID_CHANNEL, CATEGORY } from './notificationRuntime';

export { notificationsModule, notificationsSupported, configureNotifications, getPermissionState, requestPermissionState, type PermissionState } from './notificationRuntime';
export { subscribeToTaps, getLaunchTapSubscriptionId } from './notificationResponses';

async function ownRequests(N: NotificationsModule) {
  const all = await N.getAllScheduledNotificationsAsync();
  return all.filter((request) => isPlannedIdentifier(request.identifier));
}

function fingerprint(item: PlannedReminder): string {
  // Yedek bildirimlerde zaman her senkronda now+60 sn kayar; parmak izine girmez ki yeniden zamanlanmasın.
  if (isCatchUpIdentifier(item.identifier)) return JSON.stringify([item.timeZone, item.title, item.body, item.subscriptionId]);
  return JSON.stringify([item.scheduled.toISOString(), item.timeZone, item.title, item.body, item.subscriptionId]);
}

/**
 * Cihazdaki mevcut bir kaydı yeniden kurmak için girdi. Yalnızca bu zamanlayıcının kurduğu tarih
 * tetikleyicili kayıtlar geri yüklenir; başka tür kayıt için `null` döner.
 */
function restoreInput(N: NotificationsModule, prior: NotificationsTypes.NotificationRequest): NotificationsTypes.NotificationRequestInput | null {
  const trigger = prior.trigger;
  if (!trigger || !('date' in trigger) || trigger.date === undefined) return null;
  return {
    identifier: prior.identifier,
    content: {
      title: prior.content.title ?? undefined,
      body: prior.content.body ?? undefined,
      data: prior.content.data,
      categoryIdentifier: prior.content.categoryIdentifier ?? undefined,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: trigger.date,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
    },
  };
}

/** Planı cihaza yansıtır: fazlaları iptal eder, eksikleri ekler. Dönen değer yapılan işlem sayılarıdır. */
export function syncReminders(planned: PlannedReminder[], knownSubscriptionIds?: string[]): Promise<{ added: number; removed: number }> {
  return notificationSerial(() => synchronize(planned, knownSubscriptionIds));
}

export function cancelSubscriptionReminders(ids: string[]): Promise<void> {
  return notificationSerial(async () => {
    const deleted = [...new Set([...(await removedSubscriptionIds()), ...ids])];
    await writeJson(DELETED_KEY, deleted);
    await cleanRemoved(deleted);
  });
}

async function cleanRemoved(ids: string[]) {
  if (!ids.length) return;
  const N = notificationsModule();
  if (!N) return;
  for (const request of await N.getAllScheduledNotificationsAsync()) {
    if (ids.includes(String(request.content?.data?.subscriptionId))) await N.cancelScheduledNotificationAsync(request.identifier);
  }
}

async function synchronize(planned: PlannedReminder[], knownSubscriptionIds?: string[]): Promise<{ added: number; removed: number }> {
  const N = notificationsModule();
  if (!N) return { added: 0, removed: 0 };
  const deleted = await removedSubscriptionIds();
  await cleanRemoved(deleted);
  if (knownSubscriptionIds) {
    for (const request of await N.getAllScheduledNotificationsAsync()) {
      const id = request.content?.data?.subscriptionId;
      if ((isPlannedIdentifier(request.identifier) || request.identifier.startsWith(SNOOZE_IDENTIFIER_PREFIX)) && typeof id === 'string' && !knownSubscriptionIds.includes(id)) {
        await N.cancelScheduledNotificationAsync(request.identifier);
      }
    }
  }
  const allRequests = await N.getAllScheduledNotificationsAsync();
  const reserved = allRequests.filter((request) => !isPlannedIdentifier(request.identifier)).length;
  planned = planned.filter((item) => !deleted.includes(item.subscriptionId)).slice(0, Math.max(0, REMINDER_LIMIT - reserved));
  const existing = await ownRequests(N);
  const wanted = new Set(planned.map((item) => item.identifier));
  const present = new Map(existing.map((request) => [request.identifier, request]));

  let removed = 0;
  for (const request of existing) {
    // Tek seferlik yedek bildirim kalıcı işaretle planlayıcıdan çıkar; teslim edilene dek iptal edilmez.
    if (!wanted.has(request.identifier) && !isCatchUpIdentifier(request.identifier)) {
      await N.cancelScheduledNotificationAsync(request.identifier);
      removed += 1;
    }
  }

  let added = 0;
  for (const item of planned) {
    const prior = present.get(item.identifier);
    if (prior?.content.data?.planFingerprint === fingerprint(item)) continue;
    if (prior) {
      await N.cancelScheduledNotificationAsync(item.identifier);
      removed += 1;
    }
    try {
      await N.scheduleNotificationAsync({
        identifier: item.identifier,
        content: {
          title: item.title,
          body: item.body,
          data: { subscriptionId: item.subscriptionId, planFingerprint: fingerprint(item) },
          categoryIdentifier: CATEGORY,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: item.scheduled,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
        },
      });
    } catch (error) {
      // Eski kayıt iptal edildi ama yenisi kurulamadı: önceki içerikle geri yükle ki hatırlatma kaybolmasın.
      const restore = prior ? restoreInput(N, prior) : null;
      if (restore) await N.scheduleNotificationAsync(restore);
      throw error;
    }
    added += 1;
  }
  return { added, removed };
}

/** Bildirimlerin çalıştığını doğrulamak için 5 saniye sonra tek bir yerel bildirim planlar (Flutter `sendTestNotification`). */
export function sendTestReminder(): Promise<boolean> {
  return notificationSerial(sendTest);
}
async function sendTest(): Promise<boolean> {
  const N = notificationsModule();
  if (!N) return false;
  if (normalizedPermission(await N.getPermissionsAsync(), N) !== 'granted') return false;
  const requests = await N.getAllScheduledNotificationsAsync();
  if (requests.length >= REMINDER_LIMIT && !requests.some((request) => request.identifier === 'st:test')) {
    throw new Error('Bildirim kapasitesi doldu. Test bildirimi planlanamadı.');
  }
  await N.scheduleNotificationAsync({
    identifier: 'st:test',
    content: { title: 'SubscriptTrack', body: 'Bildirimler çalışıyor.' },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
    },
  });
  return true;
}

/** Uygulamanın tüm yerel hatırlatmalarını kaldırır (bildirimler kapatıldığında). */
export function cancelAllReminders(): Promise<number> {
  return notificationSerial(cancelAll);
}
async function cancelAll(): Promise<number> {
  const N = notificationsModule();
  if (!N) return 0;
  const existing = (await N.getAllScheduledNotificationsAsync()).filter((request) => isPlannedIdentifier(request.identifier) || request.identifier.startsWith(SNOOZE_IDENTIFIER_PREFIX));
  for (const request of existing) {
    await N.cancelScheduledNotificationAsync(request.identifier);
  }
  return existing.length;
}
