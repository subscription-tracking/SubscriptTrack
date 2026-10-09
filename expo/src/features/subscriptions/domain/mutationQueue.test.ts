import { type QueueEntry, type QueueStage, type StepOutcome, drainQueue, pendingWrites } from './mutationQueue';
import { type SubscriptionOperation } from './subscriptionOperations';
import { type UpdatePayload } from './subscriptionEdit';

const update = (id: string, options: { event?: boolean; savings?: boolean } = {}): SubscriptionOperation => {
  const payload: UpdatePayload = {
    p_idempotency_key: `key-${id}-12345678`,
    p_subscription_id: id,
    p_name: 'Netflix',
    p_amount: '149.99',
    p_currency: 'TRY',
    p_billing_cycle: 'monthly',
    p_start_date: null,
    p_next_renewal_date: '2026-10-12',
    p_category: 'streaming',
    p_notes: null,
    p_payment_method: null,
    p_trial_end_date: null,
    p_trial_price_after: null,
    p_notification_rules: [],
    p_status: 'paused',
  };
  return {
    kind: 'update',
    payload,
    event: options.event ? { eventType: 'STATUS_CHANGED', payload: { from_status: 'active', to_status: 'paused' } } : null,
    savings: options.savings ? { eventType: 'PAUSED', monthlyAmount: '149.99', annualAmount: '1799.88', currency: 'TRY' } : null,
  };
};

const entry = (id: string, op: SubscriptionOperation, stage: QueueStage = 'write'): QueueEntry => ({
  id,
  userId: 'user-1',
  createdAt: '2026-10-09T10:00:00.000Z',
  stage,
  op,
});

/** Aşama başına sırayla sonuç döndüren sahte işleyici. Çağrıları ve kalıcılaştırmaları kaydeder. */
function handlers(outcomes: Partial<Record<QueueStage, StepOutcome[]>> = {}) {
  const calls: string[] = [];
  const persisted: QueueEntry[][] = [];
  const queues: Record<QueueStage, StepOutcome[]> = {
    write: [...(outcomes.write ?? [])],
    event: [...(outcomes.event ?? [])],
    savings: [...(outcomes.savings ?? [])],
  };
  return {
    calls,
    persisted,
    handlers: {
      step: async (stage: QueueStage, op: SubscriptionOperation) => {
        calls.push(`${stage}:${op.kind === 'update' ? op.payload.p_subscription_id : 'create'}`);
        return queues[stage].shift() ?? 'ok';
      },
      persist: async (queue: QueueEntry[]) => {
        persisted.push(queue);
      },
    },
  };
}

describe('drainQueue', () => {
  it('boş kuyrukta hiçbir şey yapmaz', async () => {
    const h = handlers();
    const result = await drainQueue([], h.handlers);
    expect(result).toEqual({ remaining: [], rejected: [], eventsMissed: 0, stopped: false });
    expect(h.calls).toEqual([]);
  });

  it('FIFO sırasıyla yazar; olay ve tasarruf aşamalarını sırayla işler', async () => {
    const h = handlers();
    const queue = [entry('a', update('a', { event: true, savings: true })), entry('b', update('b'))];
    const result = await drainQueue(queue, h.handlers);
    expect(h.calls).toEqual(['write:a', 'event:a', 'savings:a', 'write:b']);
    expect(result.remaining).toEqual([]);
    expect(result.stopped).toBe(false);
  });

  it('olay ve tasarruf yoksa yalnızca yazım yapılır', async () => {
    const h = handlers();
    await drainQueue([entry('a', update('a'))], h.handlers);
    expect(h.calls).toEqual(['write:a']);
  });

  it('geçici hatada durur, sırayı korur ve kalan kuyruğu döner', async () => {
    const h = handlers({ write: ['retry'] });
    const queue = [entry('a', update('a')), entry('b', update('b'))];
    const result = await drainQueue(queue, h.handlers);
    expect(h.calls).toEqual(['write:a']);
    expect(result.stopped).toBe(true);
    expect(result.remaining.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('yazım tamam, olay geçici hatayla durursa aşama olay olarak kalır ve yazım tekrarlanmaz', async () => {
    const h = handlers({ event: ['retry', 'ok'] });
    const queue = [entry('a', update('a', { event: true })), entry('b', update('b'))];
    const first = await drainQueue(queue, h.handlers);
    expect(first.stopped).toBe(true);
    expect(first.remaining[0].stage).toBe('event');

    const second = await drainQueue(first.remaining, h.handlers);
    expect(second.stopped).toBe(false);
    expect(h.calls).toEqual(['write:a', 'event:a', 'event:a', 'write:b']);
  });

  it('olay tamam, tasarruf geçici hatayla durursa yalnızca tasarruf yeniden denenir', async () => {
    const h = handlers({ savings: ['retry', 'ok'] });
    const queue = [entry('a', update('a', { event: true, savings: true }))];
    const first = await drainQueue(queue, h.handlers);
    expect(first.remaining[0].stage).toBe('savings');

    await drainQueue(first.remaining, h.handlers);
    expect(h.calls.filter((call) => call.startsWith('event'))).toEqual(['event:a']);
    expect(h.calls.filter((call) => call.startsWith('savings'))).toEqual(['savings:a', 'savings:a']);
  });

  it('kalıcı reddedilen yazımı atlar, raporlar ve sonrakilere devam eder', async () => {
    const h = handlers({ write: ['rejected', 'ok'] });
    const queue = [entry('a', update('a')), entry('b', update('b'))];
    const result = await drainQueue(queue, h.handlers);
    expect(result.rejected.map((item) => item.id)).toEqual(['a']);
    expect(result.remaining).toEqual([]);
    expect(h.calls).toEqual(['write:a', 'write:b']);
  });

  it('olay veya tasarruf kalıcı reddedilirse değişiklik geçerli sayılır, eksik kayıt sayılır', async () => {
    const h = handlers({ event: ['rejected'], savings: ['rejected'] });
    const result = await drainQueue([entry('a', update('a', { event: true, savings: true }))], h.handlers);
    expect(result.eventsMissed).toBe(2);
    expect(result.rejected).toEqual([]);
    expect(result.remaining).toEqual([]);
  });

  it('her adımdan sonra kalıcılaştırır ve son kalıcılaştırma boş kuyruktur', async () => {
    const h = handlers();
    await drainQueue([entry('a', update('a', { event: true }))], h.handlers);
    expect(h.persisted.length).toBeGreaterThan(0);
    expect(h.persisted[h.persisted.length - 1]).toEqual([]);
  });

  it('ekleme işleminde olay ve tasarruf aşaması yoktur', async () => {
    const h = handlers();
    const create: SubscriptionOperation = {
      kind: 'create',
      payload: {
        p_idempotency_key: 'create-key-1234',
        p_name: 'Canva',
        p_amount: '99.00',
        p_currency: 'TRY',
        p_billing_cycle: 'yearly',
        p_start_date: '2026-10-01',
        p_next_renewal_date: '2027-10-01',
        p_category: 'software',
        p_notes: null,
        p_payment_method: null,
        p_trial_end_date: null,
        p_trial_price_after: null,
      },
    };
    await drainQueue([entry('c', create)], h.handlers);
    expect(h.calls).toEqual(['write:create']);
  });
});

describe('pendingWrites', () => {
  it('olay ve tasarruf aşamasındaki girişler yazılmamış sayılmaz', () => {
    const done = entry('a', update('a', { event: true }), 'event');
    const todo = entry('b', update('b'));
    expect(pendingWrites([done, todo]).map((item) => item.id)).toEqual(['b']);
  });
});
