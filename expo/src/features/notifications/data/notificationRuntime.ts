import type * as NotificationsTypes from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { SNOOZE_MINUTES } from '../domain/reminderPlanner';

/**
 * Yerel bildirim zamanlayıcısı (`expo-notifications`). Uzak push yok ([ADR 0009](../../../../../docs/decisions/0009-supabase-only-architecture.md)).
 * Eşitleme farka dayanır: içerik veya zaman değişmediyse yeniden planlanmaz.
 *
 * Expo Go'da yalnız yerel API'ler yüklenir; uzak push kayıt yan etkisi başlatılmaz.
 * Web veya gerçek modül yükleme hatasında `unsupported` döner.
 */

export type NotificationsModule = Pick<typeof NotificationsTypes, keyof typeof import('./localNotifications')>;

export const ANDROID_CHANNEL = 'renewals';
export const CATEGORY = 'renewal';
export const SNOOZE_ACTION = 'snooze';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

let loaded: NotificationsModule | null | undefined;

/** `expo-notifications` modülü; kullanılamıyorsa `null`. Sonuç önbelleğe alınır. */
export function notificationsModule(): NotificationsModule | null {
  if (loaded === undefined) {
    if (Platform.OS === 'web') {
      loaded = null;
      return loaded;
    }
    try {
      // Go supports local notifications, but must not initialize remote push.
      loaded = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        ? require('./localNotifications') as NotificationsModule
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        : require('expo-notifications') as NotificationsModule;
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
export async function configureNotifications(): Promise<void> {
  const N = notificationsModule();
  if (!N) return;
  await N.setNotificationCategoryAsync(CATEGORY, [
    { identifier: SNOOZE_ACTION, buttonTitle: `${SNOOZE_MINUTES} dk ertele`, options: { opensAppToForeground: true } },
  ]);
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Abonelik yenilemeleri',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
}

export async function getPermissionState(): Promise<PermissionState> {
  const N = notificationsModule();
  if (!N) return 'unsupported';
  const permission = await N.getPermissionsAsync();
  return normalizedPermission(permission, N);
}

/** Sistem izin penceresini açar. Önce uygulama içi açıklama gösterilmelidir (USER_FLOWS §13). */
export async function requestPermissionState(): Promise<PermissionState> {
  const N = notificationsModule();
  if (!N) return 'unsupported';
  await configureNotifications();
  const permission = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return normalizedPermission(permission, N);
}

export function normalizedPermission(permission: Awaited<ReturnType<NotificationsModule['getPermissionsAsync']>>, N: NotificationsModule): PermissionState {
  if (Platform.OS === 'ios' && permission.ios) {
    switch (permission.ios.status) {
      case N.IosAuthorizationStatus.AUTHORIZED:
      case N.IosAuthorizationStatus.PROVISIONAL:
      case N.IosAuthorizationStatus.EPHEMERAL:
        return 'granted';
      case N.IosAuthorizationStatus.DENIED:
        return 'denied';
      default:
        return 'undetermined';
    }
  }
  return permission.status;
}
