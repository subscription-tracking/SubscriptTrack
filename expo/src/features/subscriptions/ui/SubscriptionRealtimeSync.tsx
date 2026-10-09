import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { subscriptionKeys } from '../data/queries';
import { subscribeToSubscriptionChanges } from '../data/subscriptionRealtime';

/**
 * Oturum açıkken abonelik değişikliklerini izler ve önbelleği geçersiz kılar: başka bir
 * cihazdaki değişiklik ekrana gelir. Görsel öğesi yoktur.
 */
export function SubscriptionRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToSubscriptionChanges(user.id, () => {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
    });
  }, [user, queryClient]);

  return null;
}
