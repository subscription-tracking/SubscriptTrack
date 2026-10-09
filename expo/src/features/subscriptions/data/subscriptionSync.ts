import { getNetworkStateAsync } from 'expo-network';

import { isOnline } from '../../../core/network/networkState';
import { readJson, writeJson } from '../../../core/storage/secureJsonStore';
import { type QueueEntry, type QueueStage, type StepOutcome, drainQueue, pendingWrites } from '../domain/mutationQueue';
import { type SubscriptionOperation, overlayPendingOperations } from '../domain/subscriptionOperations';
import { type SubscriptionRow } from '../domain/subscription';
import { createSubscription, recordSubscriptionEvent, updateSubscription } from './subscriptionWriteRepository';
import { DataWriteError } from '../../../core/errors/dataWriteError';
import { fetchSubscriptionRows } from './subscriptionRepository';
import { insertSavings } from '../../savings/data/savingsRepository';

/**
 * Çevrimdışı yerel veri: sunucu anlık görüntüsü (cache), bekleyen yazımlar (kuyruk) ve
 * senkron. Veri akışı:
 *
 * - Okuma: önce sunucu; başarılıysa cache güncellenir. Başarısızsa cache kullanılır.
 *   Bekleyen yazımlar her iki durumda da üstüne bindirilir (kullanıcı kendi değişikliğini görür).
 * - Yazma: çevrimiçi ve kuyruk boşsa doğrudan gönderilir. Aksi halde kuyruğa girer ve
 *   senkron denenir.
 *
 * Cache ve kuyruk şifreli depoda tutulur ([secureJsonStore](../../../core/storage/secureJsonStore.ts)).
 * Kuyruk işlemleri tek seri zincirden geçer; yarış nedeniyle yazım kaybolmaz.
 */

const FETCH_TIMEOUT_MS = 8000;

const cacheKey = (userId: string) => `subscriptions.cache.${userId}`;
const queueKey = (userId: string) => `subscriptions.queue.${userId}`;

export interface SubmitResult {
  status: 'sent' | 'queued';
  eventSaved: boolean;
}

export interface SyncReport {
  rejected: number;
  eventsMissed: number;
  pending: number;
}

// ─── Depo ────────────────────────────────────────────────────

export async function loadQueue(userId: string): Promise<QueueEntry[]> {
  const value = await readJson(queueKey(userId));
  return Array.isArray(value) ? (value as QueueEntry[]) : [];
}

async function saveQueue(userId: string, queue: QueueEntry[]): Promise<void> {
  await writeJson(queueKey(userId), queue);
}

async function loadCache(userId: string): Promise<SubscriptionRow[] | null> {
  const value = await readJson(cacheKey(userId));
  return Array.isArray(value) ? (value as SubscriptionRow[]) : null;
}

async function saveCache(userId: string, rows: SubscriptionRow[]): Promise<void> {
  await writeJson(cacheKey(userId), rows);
}

// ─── Seri zincir ──────────────────────────────────────────────

let chain: Promise<unknown> = Promise.resolve();

/** Verilen işi öncekilerin bitmesinden sonra çalıştırır. Hata zinciri kırmaz. */
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work);
  chain = next.catch(() => undefined);
  return next;
}

// ─── Okuma ────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Kullanıcının abonelik satırları: sunucu ya da cache, üstünde bekleyen yazımlar. */
export async function resolveRows(userId: string): Promise<SubscriptionRow[]> {
  const queue = await loadQueue(userId);
  let rows: SubscriptionRow[];
  try {
    rows = await withTimeout(fetchSubscriptionRows(), FETCH_TIMEOUT_MS);
    await saveCache(userId, rows);
  } catch (error) {
    const cached = await loadCache(userId);
    if (!cached) throw error;
    rows = cached;
  }
  return overlayPendingOperations(rows, pendingWrites(queue).map((entry) => entry.op));
}

// ─── Yazma ────────────────────────────────────────────────────

async function deviceOnline(): Promise<boolean> {
  try {
    return isOnline(await getNetworkStateAsync());
  } catch {
    return true;
  }
}

function enqueueOperation(userId: string, op: SubscriptionOperation): Promise<void> {
  return serial(async () => {
    const queue = await loadQueue(userId);
    const entry: QueueEntry = {
      id: op.payload.p_idempotency_key,
      userId,
      createdAt: new Date().toISOString(),
      stage: 'write',
      op,
    };
    await saveQueue(userId, [...queue, entry]);
  });
}

/** Çevrimiçi tek yazım. Yazım hatası fırlar; olay hatası sonucu `false` yapar. */
async function executeOnline(userId: string, op: SubscriptionOperation): Promise<boolean> {
  if (op.kind === 'create') {
    await createSubscription(op.payload);
    return true;
  }
  await updateSubscription(op.payload);
  const event = await secondaryStep(userId, 'event', op);
  const savings = await secondaryStep(userId, 'savings', op);
  return event === 'ok' && savings === 'ok';
}

/**
 * Bir yazımı gönderir. Çevrimdışıysa, ya da kuyrukta bekleyen yazım varsa (sıra bozulmasın
 * diye) kuyruğa girer ve senkron denenir. Çevrimiçi ve geçici hata varsa kuyruğa girer.
 * Kalıcı hatada (ör. kota) hata fırlatır; form içeriği korunur.
 */
export async function submitOperation(userId: string, op: SubscriptionOperation): Promise<SubmitResult> {
  const online = await deviceOnline();
  const queued = (await loadQueue(userId)).length > 0;

  if (online && !queued) {
    try {
      const eventSaved = await executeOnline(userId, op);
      return { status: 'sent', eventSaved };
    } catch (error) {
      if (!(error instanceof DataWriteError && error.retryable)) throw error;
    }
  }

  await enqueueOperation(userId, op);
  if (!online) return { status: 'queued', eventSaved: false };

  const report = await runSync(userId);
  const stillQueued = (await loadQueue(userId)).some((entry) => entry.id === op.payload.p_idempotency_key);
  return { status: stillQueued ? 'queued' : 'sent', eventSaved: report.eventsMissed === 0 };
}

// ─── Senkron ──────────────────────────────────────────────────

/** Adım sonucu: geçici hata → dur ve yeniden dene; kalıcı hata → reddet. */
function classify(error: unknown): StepOutcome {
  if (error instanceof DataWriteError) return error.retryable ? 'retry' : 'rejected';
  return 'retry';
}

async function writeStep(op: SubscriptionOperation): Promise<StepOutcome> {
  try {
    if (op.kind === 'create') await createSubscription(op.payload);
    else await updateSubscription(op.payload);
    return 'ok';
  } catch (error) {
    return classify(error);
  }
}

/** Olay ve tasarruf adımları: ilgili kayıt yoksa atlanır; hata sınıflandırılır. */
async function secondaryStep(userId: string, stage: 'event' | 'savings', op: SubscriptionOperation): Promise<StepOutcome> {
  if (op.kind !== 'update') return 'ok';
  try {
    if (stage === 'event') {
      if (op.event) await recordSubscriptionEvent(userId, op.payload.p_subscription_id, op.event);
    } else if (op.savings) {
      await insertSavings(userId, op.payload.p_subscription_id, op.savings);
    }
    return 'ok';
  } catch (error) {
    return classify(error);
  }
}

function stepFor(userId: string) {
  return (stage: QueueStage, op: SubscriptionOperation): Promise<StepOutcome> => {
    if (stage === 'write') return writeStep(op);
    return secondaryStep(userId, stage, op);
  };
}

/** Kuyruğu sırayla gönderir. Eşzamanlı çağrılar sıraya girer. Bekleyen yazım yoksa hiçbir şey yapmaz. */
export function runSync(userId: string): Promise<SyncReport> {
  return serial(async () => {
    const queue = await loadQueue(userId);
    if (queue.length === 0) return { rejected: 0, eventsMissed: 0, pending: 0 };
    const result = await drainQueue(queue, {
      step: stepFor(userId),
      persist: (next) => saveQueue(userId, next),
    });
    return {
      rejected: result.rejected.length,
      eventsMissed: result.eventsMissed,
      pending: result.remaining.length,
    };
  });
}
