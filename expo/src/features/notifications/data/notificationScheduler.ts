import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { SNOOZE_IDENTIFIER_PREFIX, SNOOZE_MINUTES, isPlannedIdentifier, type PlannedReminder } from '../domain/reminderPlanner';

/**
 * Yerel bildirim zamanlayıcısı (`expo-notifications`). Uzak push yok ([ADR 0009](../../../../../docs/decisions/0009-supabase-only-architecture.md)).
 * Eşitleme farka dayanır: zaten planlanmış kimlikler yeniden planlanmaz, planda olmayanlar
 * iptal edilir. Bu, aynı planın iki kez zamanlanmasını engeller.
 *
 * Expo Go (SDK 53+) uzak bildirim desteğini kaldırdığı için `expo-notifications` modülü orada
 * yüklenirken hata verir. Modül bu yüzden tembel yüklenir; kullanılamıyorsa tüm işlemler sessizce
 * devre dışı kalır ve izin durumu `unsupported` olur. Geliştirme derlemesinde tam çalışır.
 */

type NotificationsModule = typeof NotificationsTypes;

const ANDROID_CHANNEL = 'renewals';
const CATEGORY = 'renewal';
const SNOOZE_ACTION = 'snooze';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

let loaded: NotificationsModule | null | undefined;

/** `expo-notifications` modülü; kullanılamıyorsa `null`. Sonuç önbelleğe alınır. */
export function notificationsModule(): NotificationsModule | null {
  if (loaded === undefined) {
    // Expo Go SDK 53+ uzak bildirimleri kaldırdı; modülü yüklemek bile kırmızı hata üretir, bu yüzden hiç yüklenmez.
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      loaded = null;
      return loaded;
    }
    try {
      loaded = require('expo-notifications') as NotificationsModule;
    } catch {
      loaded = null;
    }
  }
  return loaded;
}

/** Bu derlemede yerel bildirim kullanılabilir mi? */
export function notificationsSupported(): boolean {
  return notificationsModule() !== null;
}

/** Sistem bildirim davranışı: uygulama açıkken de banner gösterilir, ses ve rozet yok. */
export function configureNotifications(): void {
  const N = notificationsModule();
  if (!N) return;
  void N.setNotificationCategoryAsync(CATEGORY, [
    { identifier: SNOOZE_ACTION, buttonTitle: `${SNOOZE_MINUTES} dk ertele`, options: { opensAppToForeground: false } },
  ]);
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void N.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Abonelik yenilemeleri',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
}

export async function getPermissionState(): Promise<PermissionState> {
  const N = notificationsModule();
  if (!N) return 'unsupported';
  const { status } = await N.getPermissionsAsync();
  return status;
}

/** Sistem izin penceresini açar. Önce uygulama içi açıklama gösterilmelidir (USER_FLOWS §13). */
export async function requestPermissionState(): Promise<PermissionState> {
  const N = notificationsModule();
  if (!N) return 'unsupported';
  const { status } = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status;
}

async function ownRequests(N: NotificationsModule) {
  const all = await N.getAllScheduledNotificationsAsync();
  return all.filter((request) => isPlannedIdentifier(request.identifier));
}

/** Planı cihaza yansıtır: fazlaları iptal eder, eksikleri ekler. Dönen değer yapılan işlem sayılarıdır. */
export async function syncReminders(planned: PlannedReminder[]): Promise<{ added: number; removed: number }> {
  const N = notificationsModule();
  if (!N) return { added: 0, removed: 0 };
  const existing = await ownRequests(N);
  const wanted = new Set(planned.map((item) => item.identifier));
  const present = new Set(existing.map((request) => request.identifier));

  let removed = 0;
  for (const request of existing) {
    if (!wanted.has(request.identifier)) {
      await N.cancelScheduledNotificationAsync(request.identifier);
      removed += 1;
    }
  }

  let added = 0;
  for (const item of planned) {
    if (present.has(item.identifier)) continue;
    await N.scheduleNotificationAsync({
      identifier: item.identifier,
      content: {
        title: item.title,
        body: item.body,
        data: { subscriptionId: item.subscriptionId },
        categoryIdentifier: CATEGORY,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: item.scheduled,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
      },
    });
    added += 1;
  }
  return { added, removed };
}

/** Bildirimlerin çalıştığını doğrulamak için 5 saniye sonra tek bir yerel bildirim planlar (Flutter `sendTestNotification`). */
export async function sendTestReminder(): Promise<boolean> {
  const N = notificationsModule();
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') return false;
  await N.scheduleNotificationAsync({
    identifier: `st:test|${Date.now()}`,
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
export async function cancelAllReminders(): Promise<number> {
  const N = notificationsModule();
  if (!N) return 0;
  const existing = await ownRequests(N);
  for (const request of existing) {
    await N.cancelScheduledNotificationAsync(request.identifier);
  }
  return existing.length;
}

/** Ertele: aynı içerikle, şimdiden `SNOOZE_MINUTES` sonrası için tek seferlik bildirim. */
async function snoozeResponse(N: NotificationsModule, response: NotificationsTypes.NotificationResponse): Promise<void> {
  const { title, body, data } = response.notification.request.content;
  await N.scheduleNotificationAsync({
    identifier: `${SNOOZE_IDENTIFIER_PREFIX}${Date.now()}`,
    content: { title, body, data, categoryIdentifier: CATEGORY },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
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
  const N = notificationsModule();
  if (!N) return () => undefined;
  const subscription = N.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === SNOOZE_ACTION) {
      void snoozeResponse(N, response);
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
  const id = response?.notification.request.content.data?.subscriptionId;
  return typeof id === 'string' ? id : null;
}
