import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import { isPlannedIdentifier, REMINDER_LIMIT, SNOOZE_IDENTIFIER_PREFIX, SNOOZE_MINUTES } from '../domain/reminderPlanner';
import { notificationSerial } from './notificationSerial';
import { removedSubscriptionIds } from './removedReminders';
import { notificationsModule, type NotificationsModule, ANDROID_CHANNEL, CATEGORY, SNOOZE_ACTION } from './notificationRuntime';

const handledSnoozes = new Set<string>();

async function handleSnooze(N: NotificationsModule, response: NotificationsTypes.NotificationResponse): Promise<void> {
  const key = `${response.notification.request.identifier}|${response.notification.date}|${response.actionIdentifier}`;
  if (handledSnoozes.has(key)) return;
  handledSnoozes.add(key);
  try {
    await snoozeResponse(N, response);
    await N.clearLastNotificationResponseAsync();
  } catch (error) {
    handledSnoozes.delete(key);
    throw error;
  }
}

/** Ertele: aynı içerikle, şimdiden `SNOOZE_MINUTES` sonrası için tek seferlik bildirim. */
async function snoozeResponse(N: NotificationsModule, response: NotificationsTypes.NotificationResponse): Promise<void> {
  const { title, body, data } = response.notification.request.content;
  if ((await removedSubscriptionIds()).includes(String(data?.subscriptionId))) return;
  const existing = await N.getAllScheduledNotificationsAsync();
  let replaced: NotificationsTypes.NotificationRequest | undefined;
  if (existing.length >= REMINDER_LIMIT) {
    const replace = existing.filter((request) => isPlannedIdentifier(request.identifier))
      .sort((a, b) => Number(b.trigger && 'date' in b.trigger ? b.trigger.date : 0) - Number(a.trigger && 'date' in a.trigger ? a.trigger.date : 0))[0];
    if (!replace) throw new Error('Erteleme kapasitesi doldu.');
    await N.cancelScheduledNotificationAsync(replace.identifier);
    replaced = replace;
  }
  try { await N.scheduleNotificationAsync({
    identifier: `${SNOOZE_IDENTIFIER_PREFIX}${String(data?.subscriptionId)}|${Date.now()}`,
    content: { title, body, data, categoryIdentifier: CATEGORY },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_MINUTES * 60,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
    },
  }); } catch (error) {
    const trigger = replaced?.trigger;
    if (replaced && trigger && 'date' in trigger && trigger.date !== undefined) {
      await N.scheduleNotificationAsync({ identifier: replaced.identifier,
        content: { title: replaced.content.title ?? undefined, body: replaced.content.body ?? undefined,
          data: replaced.content.data, categoryIdentifier: replaced.content.categoryIdentifier ?? undefined },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: trigger.date,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined } });
    }
    throw error;
  }
}

/**
 * Bildirime dokunulunca abonelik kimliğiyle `onTap` çağrılır. "Ertele" düğmesinde yalnızca ertelenmiş
 * bildirim planlanır; işlem için uygulama öne gelir, detay rotasına gidilmez.
 */
export function subscribeToTaps(onTap: (subscriptionId: string) => void, onError: (error: unknown) => void = () => undefined): () => void {
  const N = notificationsModule();
  if (!N) return () => undefined;
  const subscription = N.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === SNOOZE_ACTION) {
      void notificationSerial(() => handleSnooze(N, response)).catch(onError);
      return;
    }
    const id = response.notification.request.content.data?.subscriptionId;
    if (typeof id === 'string') onTap(id);
  });
  return () => subscription.remove();
}

export async function getLaunchTapSubscriptionId(): Promise<string | null> {
  const N = notificationsModule();
  if (!N) return null;
  const response = await N.getLastNotificationResponseAsync();
  if (response?.actionIdentifier === SNOOZE_ACTION) {
    await notificationSerial(() => handleSnooze(N, response));
    return null;
  }
  const id = response?.notification.request.content.data?.subscriptionId;
  if (response) await N.clearLastNotificationResponseAsync();
  return typeof id === 'string' ? id : null;
}
