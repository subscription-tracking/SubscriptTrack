import { getNetworkStateAsync } from 'expo-network';
import type { ConnectionState } from '../domain/subscriptionSyncTypes';
import { supabase } from '../../../core/supabase/client';

export { createSerialExecutor } from '../../../core/async/serialExecutor';

export async function deviceConnection(): Promise<ConnectionState> {
  try {
    const snapshot = await getNetworkStateAsync();
    if (snapshot.isConnected === false || snapshot.isInternetReachable === false) return 'offline';
    return snapshot.isConnected === true && snapshot.isInternetReachable === true ? 'online' : 'unknown';
  } catch { return 'unknown'; }
}

export async function sessionBelongsTo(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error && data.session?.user.id === userId;
  } catch { return false; }
}
