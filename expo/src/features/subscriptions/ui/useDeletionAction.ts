import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '../../../core/config/env';
import { useAuth } from '../../auth/AuthProvider';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { removeSubscriptions } from '../data/subscriptionSync';
import { subscriptionKeys } from '../data/queries';
import { cancelSubscriptionReminders } from '../../notifications/data/notificationScheduler';

/** Confirmation precedes every write and every native cancellation. */
export function useDeletionAction(onRemoved?: () => void) {
  const { user } = useAuth();
  const client = useQueryClient();
  const snackbar = useSnackbar();
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  function confirm(ids: string[]) {
    if (!ids.length || running.current) return;
    if (!env.softDeletionEnabled && ids.some((id) => !id.startsWith('pending:'))) {
      snackbar.show('Silme şu an kullanılamıyor. Daha sonra tekrar dene.', 'error');
      return;
    }
    Alert.alert('Abonelikleri sil', `${ids.length} kayıt listeden kaldırılacak. Ödeme ve tasarruf geçmişi korunacak. Hatırlatmalar kaldırılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { void execute(ids); } },
    ]);
  }
  async function execute(ids: string[]) {
    if (!user || running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const result = await removeSubscriptions(user.id, ids, randomUUID());
      await client.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      try { await cancelSubscriptionReminders(ids); }
      catch { snackbar.show('Kayıt kaldırıldı; hatırlatmalar temizlenemedi. Uygulama açıldığında yeniden denenecek.', 'error'); }
      if (result.status === 'queued') snackbar.show('Silme kaydedildi; bağlantı gelince eşitlenecek.');
      onRemoved?.();
    } catch (error) {
      await client.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      snackbar.show(error instanceof Error ? error.message : 'Silinemedi. Tekrar dene.', 'error');
    } finally { running.current = false; setBusy(false); }
  }
  return { confirm, busy };
}
