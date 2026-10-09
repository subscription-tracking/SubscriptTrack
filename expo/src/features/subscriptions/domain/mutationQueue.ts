import { type SubscriptionOperation } from './subscriptionOperations';

/**
 * FIFO mutation kuyruğu ([CURRENT_STATUS](../../../../../docs/CURRENT_STATUS.md) "Offline cache ve kuyruk").
 * Her giriş üç aşamadan geçer: RPC yazımı (`write`), yaşam döngüsü olayı (`event`) ve
 * tasarruf kaydı (`savings`). Olay ve tasarruf ayrı aşamalardır; biri geçici hata alırsa
 * diğeri tekrar yazılmaz. Aşama kalıcı tutulur; uygulama yarıda kapansa bile tekrar gönderilmez.
 *
 * Sonuçlar:
 * - `retry`: ağ/oturum geçici hatası. Kuyruk durur, sıra korunur, sonra tekrar denenir.
 * - `rejected`: kalıcı red. Yazım reddedilirse giriş atlanır ve raporlanır; olay/tasarruf
 *   reddedilirse değişiklik geçerli kalır, yalnızca geçmiş eksik sayılır.
 *
 * I/O yoktur: her adım dışarıdan verilen işleyiciyle yürür.
 */

export type QueueStage = 'write' | 'event' | 'savings';

const STAGE_ORDER: readonly QueueStage[] = ['write', 'event', 'savings'];

export interface QueueEntry {
  /** İdempotency anahtarı (ekleme için de geçici kimlik olarak kullanılır). */
  id: string;
  userId: string;
  createdAt: string;
  stage: QueueStage;
  op: SubscriptionOperation;
}

export type StepOutcome = 'ok' | 'retry' | 'rejected';

export interface DrainHandlers {
  step: (stage: QueueStage, op: SubscriptionOperation) => Promise<StepOutcome>;
  persist: (queue: QueueEntry[]) => Promise<void>;
}

export interface DrainResult {
  remaining: QueueEntry[];
  /** Kalıcı reddedilen yazımlar (kullanıcının değişikliği sunucuya ulaşmadı). */
  rejected: QueueEntry[];
  /** Olay veya tasarruf kaydı kalıcı reddedildi. Değişiklik geçerli, yalnızca geçmiş eksik. */
  eventsMissed: number;
  /** Geçici hata nedeniyle durdu mu? */
  stopped: boolean;
}

function hasStep(stage: QueueStage, op: SubscriptionOperation): boolean {
  if (stage === 'write') return true;
  if (op.kind === 'create') return false;
  return stage === 'event' ? op.event !== null : op.savings !== null;
}

function nextStage(stage: QueueStage): QueueStage | null {
  return STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1] ?? null;
}

export async function drainQueue(queue: readonly QueueEntry[], handlers: DrainHandlers): Promise<DrainResult> {
  let current = [...queue];
  const rejected: QueueEntry[] = [];
  let eventsMissed = 0;

  while (current.length > 0) {
    const head = current[0];

    if (!hasStep(head.stage, head.op)) {
      current = advance(current, head);
      await handlers.persist(current);
      continue;
    }

    const outcome = await handlers.step(head.stage, head.op);
    if (outcome === 'retry') return { remaining: current, rejected, eventsMissed, stopped: true };

    if (outcome === 'rejected') {
      if (head.stage === 'write') {
        rejected.push(head);
        current = current.slice(1);
        await handlers.persist(current);
        continue;
      }
      eventsMissed += 1;
    }

    current = advance(current, head);
    await handlers.persist(current);
  }

  return { remaining: [], rejected, eventsMissed, stopped: false };
}

/** Başın bir sonraki aşamaya geçmesi; aşamalar bittiyse giriş kuyruktan çıkar. */
function advance(current: QueueEntry[], head: QueueEntry): QueueEntry[] {
  const next = nextStage(head.stage);
  if (next === null) return current.slice(1);
  return [{ ...head, stage: next }, ...current.slice(1)];
}

/** Henüz sunucuya yazılmamış girişler; bunlar cache'in üstüne bindirilir. */
export function pendingWrites(queue: readonly QueueEntry[]): QueueEntry[] {
  return queue.filter((entry) => entry.stage === 'write');
}
