import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { OfflineBanner } from '../../../shared/widgets/OfflineBanner';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useAuth } from '../../auth/AuthProvider';
import { onQueueQuarantined, runSync } from '../data/subscriptionSync';
import { subscriptionKeys, usePendingWritesQuery } from '../data/queries';

/** Çevrimdışı şerit: ağ yoksa uyarır, bekleyen yazım sayısını gösterir. */
export function SubscriptionOfflineBanner() {
  useThemeRevision();
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
  useEffect(() => {
    snackbarRef.current = snackbar;
  }, [snackbar]);

  const userId = user?.id;
  useEffect(() => onQueueQuarantined((id) => {
    if (id === userId) snackbarRef.current.show('Bekleyen değişiklikler okunamadı; yedeği saklandı. Listeyi kontrol et.', 'error');
  }), [userId]);
  useEffect(() => {
    if (!userId || !online) return undefined;
    let active = true;
    const synchronize = () => { void runSync(userId)
      .then(async (report) => {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(userId) });
        if (active && report.rejected > 0) {
          snackbarRef.current.show(`${report.rejected} değişiklik sunucuda kabul edilmedi.`, 'error');
        }
      })
      .catch(() => { if (active) snackbarRef.current.show('Bekleyen işlemler okunamadı veya gönderilemedi. Kayıt korunuyor.', 'error'); }); };
    synchronize();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') synchronize(); });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [userId, online, queryClient]);

  return null;
}
