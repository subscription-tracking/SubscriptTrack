import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '../../../auth/AuthProvider';
import { formatCurrency } from '../../../../core/format/money';
import { deviceTimeZone, zoneToday } from '../../../../core/time/calendar';
import { useSnackbar } from '../../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../../savings/data/queries';
import { changeSubscriptionStatus, confirmOverdueRenewal } from '../../data/subscriptionMutations';
import { subscriptionKeys } from '../../data/queries';
import { submitNotice } from '../submitNotice';
import { monthlyEquivalent, type Subscription, type SubscriptionStatus } from '../../domain/subscription';

/**
 * Detay ekranının durum işlemleri (duraklat, devam, arşivle, yenileme onayı). Hem alt düğmeler hem üst
 * menü aynı mutasyonları kullanır; sonuç bildirimi ve önbellek yenileme burada yapılır.
 */
export function useDetailMutations(subscription: Subscription) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const change = useMutation({
    mutationFn: (to: SubscriptionStatus) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({ userId: user.id, subscriptionId: subscription.id, to, idempotencyKey: randomUUID() });
    },
    onSuccess: async (result, to) => {
      if (user) {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
        await queryClient.invalidateQueries({ queryKey: savingsKeys.all(user.id) });
      }
      const notice = submitNotice(result);
      if (notice) {
        snackbar.show(notice.message, notice.tone);
      } else if (to === 'paused' || to === 'cancelled') {
        const annual = monthlyEquivalent(subscription).multiply(12);
        snackbar.show(`Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`, 'primary');
      } else if (to === 'archived') {
        snackbar.show(`${subscription.name} arşivlendi.`, 'primary');
      }
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const renew = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return confirmOverdueRenewal({
        userId: user.id,
        subscriptionId: subscription.id,
        today: zoneToday(deviceTimeZone()),
        idempotencyKey: randomUUID(),
      });
    },
    onSuccess: async (result) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      const notice = submitNotice(result);
      snackbar.show(notice?.message ?? 'Yenileme tarihi güncellendi.', notice?.tone ?? 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  return { change, renew, busy: change.isPending || renew.isPending };
}
