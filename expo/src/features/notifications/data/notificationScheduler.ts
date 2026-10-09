import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SNOOZE_IDENTIFIER_PREFIX, SNOOZE_MINUTES, isPlannedIdentifier, type PlannedReminder } from '../domain/reminderPlanner';

/**
 * Yerel bildirim zamanlayıcısı (`expo-notifications`). Uzak push yok ([ADR 0009](../../../../../docs/decisions/0009-supabase-only-architecture.md)).
 * Eşitleme farka dayanır: zaten planlanmış kimlikler yeniden planlanmaz, planda olmayanlar
 * iptal edilir. Bu, aynı planın iki kez zamanlanmasını engeller.
 */

const ANDROID_CHANNEL = 'renewals';
const CATEGORY = 'renewal';
const SNOOZE_ACTION = 'snooze';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** Sistem bildirim davranışı: uygulama açıkken de banner gösterilir, ses ve rozet yok. */
export function configureNotifications(): void {
  void Notifications.setNotificationCategoryAsync(CATEGORY, [
    { identifier: SNOOZE_ACTION, buttonTitle: `${SNOOZE_MINUTES} dk ertele`, options: { opensAppToForeground: false } },
  ]);
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Abonelik yenilemeleri',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Sistem izin penceresini açar. Önce uygulama içi açıklama gösterilmelidir (USER_FLOWS §13). */
export async function requestPermissionState(): Promise<PermissionState> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status;
}

async function ownRequests() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter((request) => isPlannedIdentifier(request.identifier));
}

/** Planı cihaza yansıtır: fazlaları iptal eder, eksikleri ekler. Dönen değer yapılan işlem sayılarıdır. */
export async function syncReminders(planned: PlannedReminder[]): Promise<{ added: number; removed: number }> {
  const existing = await ownRequests();
  const wanted = new Set(planned.map((item) => item.identifier));
  const present = new Set(existing.map((request) => request.identifier));

  let removed = 0;
  for (const request of existing) {
    if (!wanted.has(request.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      removed += 1;
    }
  }

  let added = 0;
  for (const item of planned) {
    if (present.has(item.identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: {
        title: item.title,
        body: item.body,
        data: { subscriptionId: item.subscriptionId },
        categoryIdentifier: CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.scheduled,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
      },
    });
    added += 1;
  }
  return { added, removed };
}

/** Uygulamanın tüm yerel hatırlatmalarını kaldırır (bildirimler kapatıldığında). */
export async function cancelAllReminders(): Promise<number> {
  const existing = await ownRequests();
  for (const request of existing) {
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
  return existing.length;
}

/** Ertele: aynı içerikle, şimdiden `SNOOZE_MINUTES` sonrası için tek seferlik bildirim. */
async function snoozeResponse(response: Notifications.NotificationResponse): Promise<void> {
  const { title, body, data } = response.notification.request.content;
  await Notifications.scheduleNotificationAsync({
    identifier: `${SNOOZE_IDENTIFIER_PREFIX}${Date.now()}`,
    content: { title, body, data, categoryIdentifier: CATEGORY },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SNOOZE_MINUTES * 60,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
    },
  });
}

/**
 * Bildirime dokunulunca abonelik kimliğiyle `onTap` çağrılır. "Ertele" düğmesinde yalnızca ertelenmiş
 * bildirim planlanır; uygulama açılmaz.
 */
export function subscribeToTaps(onTap: (subscriptionId: string) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === SNOOZE_ACTION) {
      void snoozeResponse(response);
      return;
    }
    const id = response.notification.request.content.data?.subscriptionId;
    if (typeof id === 'string') onTap(id);
  });
  return () => subscription.remove();
}

export async function getLaunchTapSubscriptionId(): Promise<string | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const id = response?.notification.request.content.data?.subscriptionId;
  return typeof id === 'string' ? id : null;
}
