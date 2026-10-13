import { env } from '../../../core/config/env';
import { supabase } from '../../../core/supabase/client';
import { DataWriteError } from '../../../core/errors/dataWriteError';
import { isTransientCode } from './transientErrors';

export async function softDeleteSubscriptions(payload: { p_idempotency_key: string; p_subscription_ids: string[] }): Promise<void> {
  if (!env.softDeletionEnabled) throw new DataWriteError('Silme şu an kullanılamıyor. Daha sonra tekrar dene.', { retryable: false });
  const { error } = await supabase.rpc('soft_delete_subscriptions_idempotent', payload);
  if (error) throw new DataWriteError(error.code === 'PGRST202' ? 'Silme şu an kullanılamıyor. Daha sonra tekrar dene.' : 'Kayıtlar kaldırılamadı. Tekrar dene.', { retryable: isTransientCode(error.code) });
}
