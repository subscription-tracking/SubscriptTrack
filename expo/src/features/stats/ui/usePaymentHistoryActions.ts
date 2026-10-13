import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { type CivilDate } from '../../../core/time/calendar';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { analyticsKeys } from '../data/queries';
import { deletePayment, recordPayment, updatePayment } from '../data/paymentRepository';
import { paidAtFromCivil } from '../domain/paymentEvents';

const OFFLINE_MESSAGE = 'Ödeme kaydı için internet bağlantısı gerekir.';
export function usePaymentHistoryActions(today: CivilDate, timeZone: string, closeAdd: () => void, closeEdit: () => void) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const refresh = async () => {
    if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
  };

  const add = useMutation({
    mutationFn: async (input: { subscription: Subscription; amount: string }) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await recordPayment({
        idempotencyKey: randomUUID(),
        subscriptionId: input.subscription.id,
        amount: input.amount,
        currency: input.subscription.currency,
        paidAt: paidAtFromCivil(today, timeZone),
      });
    },
    onSuccess: async () => {
      await refresh();
      closeAdd();
      snackbar.show('Ödeme kaydedildi.', 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const edit = useMutation({
    mutationFn: async (input: { id: string; amount: string; paidAt: Date }) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await updatePayment(input);
    },
    onSuccess: async () => {
      await refresh();
      closeEdit();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await deletePayment(id);
    },
    onSuccess: refresh,
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  return { add, edit, remove };
}
