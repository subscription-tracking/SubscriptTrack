import { createSubscriptionSync, type SubscriptionSyncDependencies } from './subscriptionSyncCoordinator';
import { UnsupportedStoredDataError } from '../domain/storedSubscriptions';
import { createSerialExecutor } from '../../../core/async/serialExecutor';
import type { QueueEntry } from '../domain/mutationQueue';
import type { SubscriptionOperation } from '../domain/subscriptionOperations';
import { DataWriteError } from '../../../core/errors/dataWriteError';

const operation = (key: string): SubscriptionOperation => ({ kind: 'create', payload: {
  p_idempotency_key: key, p_name: 'Plan', p_amount: '10.00', p_currency: 'TRY', p_billing_cycle: 'monthly',
  p_category: 'software', p_start_date: '2026-10-12', p_next_renewal_date: '2026-11-12',
  p_notes: null, p_payment_method: null, p_trial_end_date: null, p_trial_price_after: null,
} });

function setup() {
  let queue: QueueEntry[] = [];
  const dependencies: SubscriptionSyncDependencies = {
    loadQueue: async () => queue,
    saveQueue: async (_user, entries) => { queue = entries; },
    loadCache: async () => null, saveCache: async () => undefined,
    connectionState: async () => 'offline', sessionBelongsTo: async () => true,
    fetchSubscriptionRows: async () => [], createSubscription: jest.fn(async () => 'created-id'),
    updateSubscription: async () => undefined, recordSubscriptionEvent: async () => undefined,
    insertSavings: async () => undefined, serial: createSerialExecutor(), now: () => new Date('2026-10-12T10:00:00Z'),
  };
  return { dependencies, coordinator: createSubscriptionSync(dependencies), queue: () => queue };
}

it('serializes concurrent offline additions without losing an entry', async () => {
  const { coordinator, queue } = setup();
  await Promise.all([coordinator.submitOperation('user', operation('one')), coordinator.submitOperation('user', operation('two'))]);
  expect(queue().map((entry) => entry.id)).toEqual(['one', 'two']);
});

it('preserves unknown connection evidence while attempting the existing online fast path', async () => {
  const test = setup();
  test.dependencies.connectionState = async () => 'unknown';
  const coordinator = createSubscriptionSync(test.dependencies);
  expect(await coordinator.submitOperation('user', operation('one'))).toMatchObject({ status: 'sent', connection: 'unknown', createdId: 'created-id' });
  expect(test.dependencies.createSubscription).toHaveBeenCalledTimes(1);
});

it('retains the queue when the session changes before sending', async () => {
  const test = setup();
  await test.coordinator.submitOperation('user', operation('one'));
  test.dependencies.sessionBelongsTo = async () => false;
  const coordinator = createSubscriptionSync(test.dependencies);
  expect(await coordinator.runSync('user')).toMatchObject({ pending: 1 });
  expect(test.dependencies.createSubscription).not.toHaveBeenCalled();
});

it('keeps separate coordinator instances and queues independent', async () => {
  const first = setup();
  const second = setup();
  await first.coordinator.submitOperation('first-user', operation('one'));
  expect(first.queue()).toHaveLength(1);
  expect(second.queue()).toHaveLength(0);
});

it('cancels an unsent offline create and queues persisted deletions in FIFO order', async () => {
  const test = setup();
  await test.coordinator.submitOperation('user', operation('unsent'));
  await test.coordinator.submitOperation('user', operation('keep'));
  await test.coordinator.removeSubscriptions('user', ['pending:unsent', '10000000-0000-0000-0000-000000000001'], 'delete-key');
  expect(test.queue().map((entry) => entry.id)).toEqual(['keep', 'delete-key']);
  expect(test.queue()[1].op.kind).toBe('delete');
});
it('retains deletion on temporary error, retries once, and does not send across accounts', async () => {
  const test = setup();
  const remove = jest.fn().mockRejectedValueOnce(new DataWriteError('offline', { retryable: true })).mockResolvedValue(undefined);
  const session = jest.fn(async () => true);
  test.dependencies.sessionBelongsTo = session;
  test.dependencies.softDeleteSubscriptions = remove;
  const coordinator = createSubscriptionSync(test.dependencies);
  await coordinator.removeSubscriptions('user', ['10000000-0000-0000-0000-000000000001'], 'delete-key');
  session.mockResolvedValue(false);
  expect(await coordinator.runSync('user')).toMatchObject({ pending: 1 });
  expect(remove).not.toHaveBeenCalled();
  session.mockResolvedValue(true);
  expect(await coordinator.runSync('user')).toMatchObject({ pending: 1 });
  expect(await coordinator.runSync('user')).toMatchObject({ pending: 0 });
  expect(remove).toHaveBeenCalledTimes(2);
});
it('reports permanent deletion rejection and preserves queue when persistence rejects', async () => {
  const test = setup();
  test.dependencies.connectionState = async () => 'online';
  test.dependencies.softDeleteSubscriptions = async () => { throw new DataWriteError('foreign', { retryable: false }); };
  await expect(createSubscriptionSync(test.dependencies).removeSubscriptions('user', ['10000000-0000-0000-0000-000000000001'], 'delete-key')).rejects.toThrow('reddedildi');
  expect(test.queue()).toHaveLength(0);
  test.dependencies.saveQueue = async () => { throw new Error('keystore'); };
  await expect(createSubscriptionSync(test.dependencies).removeSubscriptions('user', ['10000000-0000-0000-0000-000000000001'], 'delete-again')).rejects.toThrow('keystore');
});

it('persists before an online create and deletes an ambiguous committed create after resolving its ID', async () => {
  const test = setup();
  test.dependencies.connectionState = async () => 'online';
  test.dependencies.createSubscription = jest.fn(async () => {
    expect(test.queue()[0].op).toMatchObject({ attempted: true });
    throw new DataWriteError('response lost', { retryable: true });
  });
  const coordinator = createSubscriptionSync(test.dependencies);
  expect(await coordinator.submitOperation('user', operation('uncertain'))).toMatchObject({ status: 'queued' });
  test.dependencies.connectionState = async () => 'offline';
  await coordinator.removeSubscriptions('user', ['pending:uncertain'], 'delete-uncertain');
  expect(test.queue()[0].op).toMatchObject({ deleteAfterCreate: 'delete-uncertain:uncertain' });
  test.dependencies.createSubscription = jest.fn(async () => '10000000-0000-0000-0000-000000000001');
  const remove = jest.fn().mockRejectedValueOnce(new DataWriteError('network', { retryable: true })).mockResolvedValue(undefined);
  test.dependencies.softDeleteSubscriptions = remove;
  const resumed = createSubscriptionSync(test.dependencies);
  expect(await resumed.runSync('user')).toMatchObject({ pending: 1 });
  expect(test.queue()[0].op).toMatchObject({ createdId: '10000000-0000-0000-0000-000000000001' });
  expect(await resumed.runSync('user')).toMatchObject({ pending: 0 });
  expect(test.dependencies.createSubscription).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenLastCalledWith({ p_idempotency_key: 'delete-uncertain:uncertain', p_subscription_ids: ['10000000-0000-0000-0000-000000000001'] });
});

it('keeps custom reminder days in offline creation and retries their update without creating twice', async () => {
  const test = setup();
  const create = operation('custom');
  const rules = [{ daysBefore: 0, enabled: true }, { daysBefore: 7, enabled: true }];
  if (create.kind !== 'create') throw new Error('fixture');
  create.reminderRules = rules;
  await test.coordinator.submitOperation('user', create);
  const update = jest.fn().mockRejectedValueOnce(new DataWriteError('network', { retryable: true })).mockResolvedValue(undefined);
  test.dependencies.updateSubscription = update;
  const resumed = createSubscriptionSync(test.dependencies);
  expect(await resumed.runSync('user')).toMatchObject({ pending: 1 });
  expect(await resumed.runSync('user')).toMatchObject({ pending: 0 });
  expect(test.dependencies.createSubscription).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, expect.objectContaining({ p_idempotency_key: 'custom:reminders', p_notification_rules: rules }));
  expect(update.mock.calls[1][0]).toEqual(update.mock.calls[0][0]);
});

// Senaryo 12: kısa sürede art arda 10 çevrimdışı ekleme; hiçbiri kaybolmaz, sıra korunur.
it('rapid burst of ten offline additions keeps every entry in submission order', async () => {
  const { coordinator, queue } = setup();
  const keys = Array.from({ length: 10 }, (_, index) => `burst-${index}`);
  await Promise.all(keys.map((key) => coordinator.submitOperation('user', operation(key))));
  expect(queue().map((entry) => entry.id)).toEqual(keys);
});

const row = (id: string) => ({ id, name: 'Plan', amount: '10.00', currency: 'TRY', billing_cycle: 'monthly', category: 'software', status: 'active',
  payment_method: null, notes: null, website: null, start_date: '2026-10-12', next_renewal_date: '2026-11-12', trial_end_date: null,
  trial_price_after: null }) as never;

it('gelecek sürüm kuyruğu silinmeden karantinaya alınır, boş kuyrukla devam edilir ve bildirilir', async () => {
  const { dependencies, queue } = setup();
  const future = { version: 3, entries: [{ id: 'x' }] };
  const loaded: unknown[] = [];
  dependencies.loadQueue = async () => { if (!loaded.length) { loaded.push(1); throw new UnsupportedStoredDataError(future); } return queue(); };
  const quarantineQueue = jest.fn(async () => undefined);
  const onQuarantine = jest.fn();
  const coordinator = createSubscriptionSync({ ...dependencies, quarantineQueue, onQuarantine });
  await coordinator.submitOperation('user', operation('one'));
  expect(quarantineQueue).toHaveBeenCalledWith('user', future);
  expect(onQuarantine).toHaveBeenCalledWith('user');
  expect(queue().map((entry) => entry.id)).toEqual(['one']);
});

it('karantina yazılamazsa özgün kuyruk silinmez ve hata yayılır', async () => {
  const { dependencies } = setup();
  dependencies.loadQueue = async () => { throw new UnsupportedStoredDataError({ version: 3 }); };
  const saveQueue = jest.fn(async () => undefined);
  const coordinator = createSubscriptionSync({ ...dependencies, saveQueue, quarantineQueue: async () => { throw new Error('yazılamadı'); } });
  await expect(coordinator.resolveRows('user')).rejects.toThrow('yazılamadı');
  expect(saveQueue).not.toHaveBeenCalled();
});

it('saveCache hata verse de taze satırlar döner; içerik değişmediyse yeniden yazılmaz', async () => {
  const { dependencies } = setup();
  dependencies.connectionState = async () => 'online';
  dependencies.fetchSubscriptionRows = async () => [row('a')];
  const saveCache = jest.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(undefined);
  const coordinator = createSubscriptionSync({ ...dependencies, saveCache });
  expect(await coordinator.resolveRows('user')).toHaveLength(1);
  expect(await coordinator.resolveRows('user')).toHaveLength(1); // ilk yazım başarısızdı: tekrar denenir
  expect(await coordinator.resolveRows('user')).toHaveLength(1); // aynı içerik: yazılmaz
  expect(saveCache).toHaveBeenCalledTimes(2);
});

it('okunamayan önbellek çevrimdışıyken yok sayılır', async () => {
  const { dependencies } = setup();
  dependencies.loadCache = async () => { throw new UnsupportedStoredDataError({ version: 3 }); };
  await expect(createSubscriptionSync(dependencies).resolveRows('user')).rejects.toThrow('Çevrimdışı kopya yok');
});
