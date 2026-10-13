import { createSerialExecutor, deviceConnection, sessionBelongsTo } from './subscriptionRuntime';
import { loadQueue, saveQueue, loadCache, saveCache } from './subscriptionLocalStore';
import { createSubscription, recordSubscriptionEvent, updateSubscription } from './subscriptionWriteRepository';
import { fetchSubscriptionRows } from './subscriptionRepository';
import { insertSavings } from '../../savings/data/savingsRepository';
import { createSubscriptionSync } from './subscriptionSyncCoordinator';
import { softDeleteSubscriptions } from './subscriptionDeleteRepository';
import { env } from '../../../core/config/env';
import { writeJson } from '../../../core/storage/secureJsonStore';

export type { SubmitResult, SyncReport } from '../domain/subscriptionSyncTypes';
export { loadQueue } from './subscriptionLocalStore';
export { createSubscriptionSync } from './subscriptionSyncCoordinator';

/** Karantinaya alınan kuyruğu (ör. gelecek sürüm) bildirmek için dinleyiciler; UI isterse abone olur. */
const quarantineListeners = new Set<(userId: string) => void>();
export function onQueueQuarantined(listener: (userId: string) => void): () => void {
  quarantineListeners.add(listener);
  return () => { quarantineListeners.delete(listener); };
}

const coordinator = createSubscriptionSync({
  loadQueue, saveQueue, loadCache, saveCache, connectionState: deviceConnection, sessionBelongsTo,
  fetchSubscriptionRows, createSubscription, updateSubscription, recordSubscriptionEvent, insertSavings,
  serial: createSerialExecutor(), now: () => new Date(),
  softDeleteSubscriptions,
  quarantineQueue: (userId, raw) => writeJson(`subscriptions.queue.${userId}.quarantine`, raw),
  onQuarantine: (userId) => quarantineListeners.forEach((listener) => listener(userId)),
  softDeleteAllowed: () => env.softDeletionEnabled,
});
export const { resolveRows, submitOperation, runSync } = coordinator;
export async function removeSubscriptions(userId: string, ids: string[], key: string) {
  if (!env.softDeletionEnabled && ids.some((id) => !id.startsWith('pending:'))) throw new Error('Silme şu an kullanılamıyor. Daha sonra tekrar dene.');
  return coordinator.removeSubscriptions(userId, ids, key);
}
