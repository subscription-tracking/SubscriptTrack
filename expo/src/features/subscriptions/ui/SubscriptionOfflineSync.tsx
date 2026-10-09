import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { OfflineBanner } from '../../../shared/widgets/OfflineBanner';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useAuth } from '../../auth/AuthProvider';
import { runSync } from '../data/subscriptionSync';
import { subscriptionKeys, usePendingWritesQuery } from '../data/queries';

/** Çevrimdışı şerit: ağ yoksa uyarır, bekleyen yazım sayısını gösterir. */
export function SubscriptionOfflineBanner() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const pending = usePendingWritesQuery(user?.id);
  return <OfflineBanner visible={!online} pendingCount={pending.data ?? 0} />;
}

/**
 * Bağlantı geldiğinde bekleyen yazımları gönderir ve listeyi yeniler. Kalıcı reddedilen
 * yazımlar kullanıcıya bildirilir. Görsel öğesi yoktur.
 */
export function SubscriptionOfflineSync() {
  const { user } = useAuth();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const snackbarRef = useRef(snackbar);
  snackbarRef.current = snackbar;

  const userId = user?.id;
  useEffect(() => {
    if (!userId || !online) return undefined;
    let active = true;
    runSync(userId)
      .then(async (report) => {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(userId) });
        if (active && report.rejected > 0) {
          snackbarRef.current.show(`${report.rejected} değişiklik sunucuda kabul edilmedi.`, 'error');
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId, online, queryClient]);

  return null;
}
