import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../savings/data/queries';
import { subscriptionKeys } from '../data/queries';
import { changeSubscriptionStatus } from '../data/subscriptionMutations';
import type { Subscription } from '../domain/subscription';
import type { SubmitResult } from '../data/subscriptionSync';

export function useCancellationAction(subscription: Subscription, to: 'paused' | 'cancelled', savedMessage: string) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  return useMutation({
    mutationFn: (eventExtra: Record<string, string> | undefined) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({ userId: user.id, subscriptionId: subscription.id, to, idempotencyKey: randomUUID(), ...(eventExtra ? { eventExtra } : {}) });
    },
    onSuccess: async (result) => {
      await invalidate(queryClient, user?.id);
      snackbar.show(savingsMessage(result, savedMessage), 'primary');
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });
}

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined): Promise<void> {
  if (!userId) return;
  await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(userId) });
  await queryClient.invalidateQueries({ queryKey: savingsKeys.all(userId) });
}

/** Kuyruğa girdiyse bunu, aksi halde tasarruf mesajını gösterir. */
function savingsMessage(result: SubmitResult, savedMessage: string): string {
  return result.status === 'queued' ? 'Bağlantı yok. Değişiklik bağlantı gelince gönderilecek.' : savedMessage;
}
