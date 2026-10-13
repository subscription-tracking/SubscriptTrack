import { readJsonStrict, removeJson, writeJson } from '../../../core/storage/secureJsonStore';
import { registerSessionCleaner } from '../../../core/security/sessionCleanup';
import { decodeCache, decodeQueue } from '../domain/storedSubscriptions';
import type { QueueEntry } from '../domain/mutationQueue';
import type { SubscriptionRow } from '../domain/subscription';

const cacheKey = (userId: string) => `subscriptions.cache.${userId}`;
const queueKey = (userId: string) => `subscriptions.queue.${userId}`;
export const loadQueue = async (userId: string) => decodeQueue(await readJsonStrict(queueKey(userId)), userId);
export const loadCache = async (userId: string) => decodeCache(await readJsonStrict(cacheKey(userId)));
export const saveQueue = (userId: string, entries: QueueEntry[]) => writeJson(queueKey(userId), { version: entries.some((entry) => entry.op.kind === 'delete' || entry.op.kind === 'create' && entry.op.attempted !== undefined) ? 2 : 1, entries });
export const saveCache = (userId: string, entries: SubscriptionRow[]) => writeJson(cacheKey(userId), { version: 1, entries });

/** Çıkış ve hesap silmede kullanıcının yerel abonelik önbelleğini ve bekleyen kuyruğunu siler. */
export async function clearSubscriptionLocalData(userId: string): Promise<void> {
  await Promise.all([removeJson(cacheKey(userId)), removeJson(queueKey(userId))]);
}
registerSessionCleaner('subscriptions', (userId) => clearSubscriptionLocalData(userId));
