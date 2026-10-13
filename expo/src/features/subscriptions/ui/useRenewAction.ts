import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { zoneToday } from '../../../core/time/calendar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useAuth } from '../../auth/AuthProvider';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { analyticsKeys } from '../../stats/data/queries';
import { subscriptionKeys } from '../data/queries';
import { confirmOverdueRenewal } from '../data/subscriptionMutations';
import { type Subscription } from '../domain/subscription';
import { submitNotice } from './submitNotice';

/**
 * "Ödendi ve yenilendi" eylemi: vadesi gelen aboneliğin yenilemesini onaylar ve tarihi ilerletir
 * (otomatik ilerletme yoktur, PARITY §4). Detay ekranı ve ana sayfadaki satır içi "Ödendi" aynı kancayı
 * kullanır; hangi aboneliğin yenileneceği `mutate(subscription)` ile verilir.
 */
export function useRenewAction() {
  const { user } = useAuth();
  const timeZone = useUserTimeZone();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  return useMutation({
    mutationFn: (subscription: Subscription) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return confirmOverdueRenewal({
        userId: user.id,
        subscriptionId: subscription.id,
        today: zoneToday(timeZone),
        timeZone,
        idempotencyKey: randomUUID(),
      });
    },
    onSuccess: async (result) => {
      if (user) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) }),
          queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) }),
        ]);
      }
      const notice = submitNotice(result);
      snackbar.show(notice?.message ?? 'Yenileme tarihi güncellendi.', notice?.tone ?? 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });
}
