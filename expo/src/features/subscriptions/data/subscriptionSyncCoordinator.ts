import { DataWriteError } from '../../../core/errors/dataWriteError';
import { type QueueEntry, type QueueStage, type StepOutcome, drainQueue, pendingWrites } from '../domain/mutationQueue';
import { type SubscriptionOperation, type SavingsDraft, overlayPendingOperations } from '../domain/subscriptionOperations';
import { UnsupportedStoredDataError } from '../domain/storedSubscriptions';
import type { SubscriptionRow } from '../domain/subscription';
import type { CreateSubscriptionPayload } from '../domain/subscriptionForm';
import type { UpdatePayload, SubscriptionEventDraft } from '../domain/subscriptionEdit';
import type { ConnectionState, SubmitResult, SyncReport } from '../domain/subscriptionSyncTypes';

export interface SubscriptionSyncDependencies {
  loadQueue: (userId: string) => Promise<QueueEntry[]>;
  saveQueue: (userId: string, queue: QueueEntry[]) => Promise<void>;
  loadCache: (userId: string) => Promise<SubscriptionRow[] | null>;
  saveCache: (userId: string, rows: SubscriptionRow[]) => Promise<void>;
  connectionState: () => Promise<ConnectionState>;
  sessionBelongsTo: (userId: string) => Promise<boolean>;
  fetchSubscriptionRows: () => Promise<SubscriptionRow[]>;
  createSubscription: (payload: CreateSubscriptionPayload) => Promise<string | null>;
  updateSubscription: (payload: UpdatePayload) => Promise<void>;
  recordSubscriptionEvent: (userId: string, id: string, event: SubscriptionEventDraft) => Promise<void>;
  insertSavings: (userId: string, id: string, savings: SavingsDraft) => Promise<void>;
  serial: <T>(work: () => Promise<T>) => Promise<T>;
  now: () => Date;
  softDeleteSubscriptions?: (payload: { p_idempotency_key: string; p_subscription_ids: string[] }) => Promise<void>;
  softDeleteAllowed?: () => boolean;
  /** Okunamayan (ör. gelecek sürüm) kuyruk ham değerini `<anahtar>.quarantine` altına kopyalar. Başarısızsa fırlatır. */
  quarantineQueue?: (userId: string, raw: unknown) => Promise<void>;
  /** Kuyruk karantinaya alındığında çağrılır; kullanıcıya bildirmek için. */
  onQuarantine?: (userId: string) => void;
}

const FETCH_TIMEOUT_MS = 8000;
/** I/O bağımlılıkları composition sınırından alınan FIFO koordinatörü. */
export function createSubscriptionSync(dependencies: SubscriptionSyncDependencies) {
  const { loadQueue: loadQueueRaw, saveQueue, loadCache: loadCacheRaw, saveCache: saveCacheRaw, connectionState, sessionBelongsTo,
    fetchSubscriptionRows, createSubscription, updateSubscription, recordSubscriptionEvent,
    insertSavings, serial, now } = dependencies;
  /**
   * Kuyruk okunamayan sürümdeyse veri silinmez: ham değer karantinaya kopyalanır, kuyruk boş devam eder.
   * Karantina yazılamazsa hata fırlar ve özgün kayıt olduğu gibi kalır.
   */
  const loadQueue = async (userId: string): Promise<QueueEntry[]> => {
    try {
      return await loadQueueRaw(userId);
    } catch (error) {
      if (!(error instanceof UnsupportedStoredDataError) || !dependencies.quarantineQueue) throw error;
      await dependencies.quarantineQueue(userId, error.raw);
      await saveQueue(userId, []);
      dependencies.onQuarantine?.(userId);
      return [];
    }
  };
  /** Okunamayan önbellek yok sayılır; çağıran taze satırları çekip üzerine yazar. */
  const loadCache = async (userId: string): Promise<SubscriptionRow[] | null> => {
    try {
      return await loadCacheRaw(userId);
    } catch (error) {
      if (error instanceof UnsupportedStoredDataError) return null;
      throw error;
    }
  };
  // Okuyucu ve yazıcı aynı FIFO kilidini kullanır; ağ çağrısı kilit dışında kalır.
  const readQueue = (userId: string) => serial(() => loadQueue(userId));
  const readCache = (userId: string) => serial(() => loadCache(userId));
  const cacheDigests = new Map<string, string>();
  /** İçerik değişmediyse yazmaz. Yazma hatası taze satırların kullanıcıya dönmesini engellemez. */
  const writeCache = (userId: string, rows: SubscriptionRow[]): Promise<void> => serial(async () => {
    const digest = JSON.stringify(rows);
    if (cacheDigests.get(userId) === digest) return;
    try {
      await saveCacheRaw(userId, rows);
      cacheDigests.set(userId, digest);
    } catch {
      cacheDigests.delete(userId);
    }
  });
  const sessionChangedError = () => new DataWriteError('Oturum değişti. Bekleyen işlem bu hesaba gönderilmedi.', { retryable: true });
  const requireSessionUser = async (userId: string) => {
    if (!(await sessionBelongsTo(userId))) throw sessionChangedError();
  };
  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  /** Kullanıcının abonelik satırları: sunucu ya da cache, üstünde bekleyen yazımlar. */
  async function resolveRows(userId: string): Promise<SubscriptionRow[]> {
    const queue = await readQueue(userId);
    if (!(await sessionBelongsTo(userId))) throw sessionChangedError();
    let rows: SubscriptionRow[];
    if (await connectionState() === 'offline') {
      const cached = await readCache(userId);
      if (!(await sessionBelongsTo(userId))) throw sessionChangedError();
      if (cached === null && pendingWrites(queue).length === 0) throw new Error('Çevrimdışı kopya yok. İlk yükleme için bağlantı gerekir.');
      return overlayPendingOperations((cached ?? []).filter((row) => !row.deleted_at), pendingWrites(queue).map((entry) => entry.op));
    }
    try {
      rows = await withTimeout(fetchSubscriptionRows(), FETCH_TIMEOUT_MS);
      if (!(await sessionBelongsTo(userId))) throw sessionChangedError();
      await writeCache(userId, rows);
    } catch (error) {
      if (!(await sessionBelongsTo(userId))) throw sessionChangedError();
      const cached = await readCache(userId);
      if (!cached) throw error;
      rows = cached;
    }
    return overlayPendingOperations(rows.filter((row) => !row.deleted_at), pendingWrites(queue).map((entry) => entry.op));
  }

  // ─── Yazma ────────────────────────────────────────────────────

  function enqueueOperation(userId: string, op: SubscriptionOperation, attempted = false): Promise<void> {
    return serial(async () => {
      const queue = await loadQueue(userId);
      const entry: QueueEntry = {
        id: op.payload.p_idempotency_key,
        userId,
        createdAt: now().toISOString(),
        stage: 'write',
        op: op.kind === 'create' ? { ...op, attempted } : op,
      };
      await saveQueue(userId, [...queue, entry]);
    });
  }

  /** Çevrimiçi tek yazım. Yazım hatası fırlar; olay hatası sonucu `false` yapar. */
  async function applyCreateRules(userId: string, op: Extract<SubscriptionOperation, { kind: 'create' }>, id: string | null) {
    if (!op.reminderRules) return;
    if (!id) throw new DataWriteError('Hatırlatma için kayıt kimliği bekleniyor.', { retryable: true });
    await requireSessionUser(userId);
    await updateSubscription({ ...op.payload, p_idempotency_key: `${op.payload.p_idempotency_key}:reminders`,
      p_subscription_id: id, p_notification_rules: op.reminderRules, p_status: op.payload.p_trial_end_date ? 'trial' : 'active' });
  }

  async function executeOnline(userId: string, op: SubscriptionOperation): Promise<string | null> {
    if (op.kind !== 'create') throw new Error('Güncellemeler kalıcı senkron kuyruğundan gönderilmelidir.');
    await requireSessionUser(userId);
    const createdId = await createSubscription(op.payload);
    await requireSessionUser(userId);
    await applyCreateRules(userId, op, createdId);
    return createdId;
  }

  /**
   * Bir yazımı gönderir. Çevrimdışıysa, ya da kuyrukta bekleyen yazım varsa (sıra bozulmasın
   * diye) kuyruğa girer ve senkron denenir. Çevrimiçi ve geçici hata varsa kuyruğa girer.
   * Kalıcı hatada (ör. kota) hata fırlatır; form içeriği korunur.
   */
  async function submitOperation(userId: string, op: SubscriptionOperation): Promise<SubmitResult> {
    const connection = await connectionState();
    const online = connection !== 'offline';
    const connectionDetails = connection === 'unknown' ? { connection } : {};
    const queued = (await readQueue(userId)).length > 0;

    // Ekleme RPC'si kayıt kimliğini döndürür; ilk ödeme bağı için çevrimiçi hızlı yol korunur.
    // Güncellemeler her zaman kuyruktan geçer, böylece olay/tasarruf geçici hataları aşama aşama kalır.
    if (online && !queued && op.kind === 'create') {
      return serial(async () => {
        await requireSessionUser(userId);
        const queue = await loadQueue(userId);
        const staged: QueueEntry = { id: op.payload.p_idempotency_key, userId, createdAt: now().toISOString(), stage: 'write',
          op: { ...op, attempted: queue.length === 0 } };
        await saveQueue(userId, [...queue, staged]);
        if (queue.length) return { status: 'queued', eventSaved: false, ...connectionDetails };
        try {
          const createdId = await executeOnline(userId, op);
          await saveQueue(userId, []);
          return { status: 'sent', eventSaved: true, createdId, ...connectionDetails };
        } catch (error) {
          if (error instanceof DataWriteError && !error.retryable) { await saveQueue(userId, []); throw error; }
          return { status: 'queued', eventSaved: false, ...connectionDetails };
        }
      });
    }

    await enqueueOperation(userId, op);
    if (!online) return { status: 'queued', eventSaved: false, ...connectionDetails };

    const report = await runSync(userId);
    if (report.rejected) throw new DataWriteError('İşlem sunucu tarafından reddedildi. Listeyi yenileyip tekrar dene.', { retryable: false });
    const stillQueued = (await readQueue(userId)).some((entry) => entry.id === op.payload.p_idempotency_key);
    return { status: stillQueued ? 'queued' : 'sent', eventSaved: report.eventsMissed === 0 && !stillQueued, ...connectionDetails };
  }

  // ─── Senkron ──────────────────────────────────────────────────

  /** Adım sonucu: geçici hata → dur ve yeniden dene; kalıcı hata → reddet. */
  function classify(error: unknown): StepOutcome {
    if (error instanceof DataWriteError) return error.retryable ? 'retry' : 'rejected';
    return 'retry';
  }

  async function writeStep(op: SubscriptionOperation, userId: string, persist: () => Promise<void>): Promise<StepOutcome> {
    try {
      if (op.kind === 'delete') {
        if (!dependencies.softDeleteSubscriptions) throw new DataWriteError('Silme desteklenmiyor.', { retryable: false });
        await dependencies.softDeleteSubscriptions(op.payload);
      } else if (op.kind === 'create') {
        op.attempted = true;
        await persist(); // Persist before sending: a crash must not classify this as unsent.
        if (!op.createdId) {
          const id = await createSubscription(op.payload);
          if (id) op.createdId = id;
          await persist();
        }
        await applyCreateRules(userId, op, op.createdId ?? null);
        if (op.deleteAfterCreate) {
          await requireSessionUser(userId);
          if (!op.createdId || !dependencies.softDeleteSubscriptions) throw new DataWriteError('Silme için kayıt kimliği doğrulanamadı.', { retryable: true });
          await dependencies.softDeleteSubscriptions({ p_idempotency_key: op.deleteAfterCreate, p_subscription_ids: [op.createdId] });
        }
      }
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

  function stepFor(userId: string, persist: () => Promise<void>) {
    return async (stage: QueueStage, op: SubscriptionOperation): Promise<StepOutcome> => {
      // Oturum değiştiyse bu kullanıcının kuyruğunu tut; yeni hesabın JWT'siyle gönderme.
      if (!(await sessionBelongsTo(userId))) return 'retry';
      if (stage === 'write') return writeStep(op, userId, persist);
      return secondaryStep(userId, stage, op);
    };
  }

  /** Kuyruğu sırayla gönderir. Eşzamanlı çağrılar sıraya girer. Bekleyen yazım yoksa hiçbir şey yapmaz. */
  function runSync(userId: string): Promise<SyncReport> {
    return serial(async () => {
      let queue = await loadQueue(userId);
      if (queue.length === 0) return { rejected: 0, eventsMissed: 0, pending: 0 };
      const result = await drainQueue(queue, {
        step: stepFor(userId, () => saveQueue(userId, queue)),
        persist: async (next) => { await saveQueue(userId, next); queue = next; },
      });
      return {
        rejected: result.rejected.length,
        eventsMissed: result.eventsMissed,
        pending: result.remaining.length,
      };
    });
  }

  /** Pending creates are cancelled under the same FIFO lock used by the sender. */
  async function removeSubscriptions(userId: string, ids: string[], key: string): Promise<SubmitResult> {
    await requireSessionUser(userId);
    await serial(async () => {
      const queue = await loadQueue(userId);
      const pending = ids.filter((id) => id.startsWith('pending:'));
      if (pending.some((id) => !queue.some((entry) => entry.op.kind === 'create' && `pending:${entry.id}` === id))) {
        throw new DataWriteError('Kayıt eşitlendi. Listeyi yenileyip tekrar seç.', { retryable: false });
      }
      const remaining = queue.flatMap((entry) => {
        if (!pending.includes(`pending:${entry.id}`) || entry.op.kind !== 'create') return [entry];
        if (entry.op.attempted === false) return [];
        if (dependencies.softDeleteAllowed && !dependencies.softDeleteAllowed()) throw new DataWriteError('Silme şu an kullanılamıyor. Daha sonra tekrar dene.', { retryable: false });
        return [{ ...entry, op: { ...entry.op, deleteAfterCreate: `${key}:${entry.id}` } }];
      });
      const serverIds = ids.filter((id) => !id.startsWith('pending:'));
      if (serverIds.length) remaining.push({ id: key, userId, createdAt: now().toISOString(), stage: 'write',
        op: { kind: 'delete', payload: { p_idempotency_key: key, p_subscription_ids: [...new Set(serverIds)].sort() } } });
      await saveQueue(userId, remaining);
    });
    if (await connectionState() === 'offline') return { status: 'queued', eventSaved: false };
    const report = await runSync(userId);
    if (report.rejected) throw new DataWriteError('Silme sunucu tarafından reddedildi. Listeyi yenileyip tekrar dene.', { retryable: false });
    const pending = (await readQueue(userId)).some((entry) => entry.id === key || entry.op.kind === 'create' && entry.op.deleteAfterCreate?.startsWith(`${key}:`));
    return { status: pending ? 'queued' : 'sent', eventSaved: !pending };
  }

  return { resolveRows, submitOperation, runSync, removeSubscriptions };
}
