import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '../../../auth/AuthProvider';
import { formatCurrency } from '../../../../core/format/money';
import { useSnackbar } from '../../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../../savings/data/queries';
import { changeSubscriptionStatus } from '../../data/subscriptionMutations';
import { useRenewAction } from '../useRenewAction';
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

  const renewAction = useRenewAction();
  const renew = { mutate: () => renewAction.mutate(subscription), isPending: renewAction.isPending };

  return { change, renew, busy: change.isPending || renewAction.isPending };
}
