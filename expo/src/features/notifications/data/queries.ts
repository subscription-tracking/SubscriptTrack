import { useQuery } from '@tanstack/react-query';

import { fetchNotifications } from './notificationRepository';

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
};

/** Bildirim merkezi sorgusu. Çevrimdışıyken hata durumu gösterilir (bu veri için cache yok). */
export function useNotificationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.all(userId ?? ''),
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
    networkMode: 'always',
    retry: 1,
  });
}
