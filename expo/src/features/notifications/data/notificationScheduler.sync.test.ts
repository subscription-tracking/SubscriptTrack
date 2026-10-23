import { syncReminders, cancelSubscriptionReminders } from './notificationScheduler';
import { readJsonStrict, writeJson } from '../../../core/storage/secureJsonStore';
import type { PlannedReminder } from '../domain/reminderPlanner';
jest.mock('../../../core/storage/secureJsonStore', () => ({ readJsonStrict: jest.fn(async () => null), writeJson: jest.fn(async () => undefined) }));

const mockGetAll = jest.fn();
const mockCancel = jest.fn();
const mockSchedule = jest.fn();
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAll(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const planned: PlannedReminder = {
  identifier: 'st:r|sub-1|3|2026-11-09',
  subscriptionId: 'sub-1',
  timeZone: 'Europe/Istanbul',
  title: 'Video Plus',
  body: '49,90 ₺ yenileme',
  scheduled: new Date('2026-11-06T06:00:00.000Z'),
};
const fingerprint = (item: PlannedReminder) => JSON.stringify([item.scheduled.toISOString(), item.timeZone, item.title, item.body, item.subscriptionId]);
const existing = (item: PlannedReminder, value = fingerprint(item)) => ({ identifier: item.identifier, content: { data: { planFingerprint: value } } });

beforeEach(() => {
  jest.mocked(readJsonStrict).mockReset().mockResolvedValue(null);
  jest.mocked(writeJson).mockReset().mockResolvedValue(undefined);
  mockGetAll.mockReset().mockResolvedValue([]);
  mockCancel.mockReset().mockResolvedValue(undefined);
  mockSchedule.mockReset().mockResolvedValue(planned.identifier);
});

it('removes both normal and snoozed notifications for a deleted subscription and persists retry intent', async () => {
  mockGetAll.mockResolvedValue([
    { identifier: planned.identifier, content: { data: { subscriptionId: 'sub-1' } } },
    { identifier: 'st:z|1', content: { data: { subscriptionId: 'sub-1' } } },
    { identifier: 'st:z|2', content: { data: { subscriptionId: 'other' } } },
  ]);
  await cancelSubscriptionReminders(['sub-1']);
  expect(writeJson).toHaveBeenCalledWith('notifications.deleted-subscriptions', ['sub-1']);
  expect(mockCancel.mock.calls.map(([id]) => id)).toEqual([planned.identifier, 'st:z|1']);
});
it('keeps total planned capacity within 60 while preserving existing snoozes', async () => {
  mockGetAll.mockResolvedValue(Array.from({ length: 58 }, (_, index) => ({ identifier: `st:z|${index}` })));
  const plans = Array.from({ length: 10 }, (_, index) => ({ ...planned, identifier: `st:r|sub-${index}|3|2026-11-09`, subscriptionId: `sub-${index}` }));
  expect(await syncReminders(plans)).toMatchObject({ added: 2 });
  expect(mockSchedule).toHaveBeenCalledTimes(2);
  expect(mockCancel).not.toHaveBeenCalled();
});
it('does not schedule over an unreadable deletion marker and retries native cancellation on reopen', async () => {
  jest.mocked(readJsonStrict).mockRejectedValueOnce(new Error('keystore'));
  await expect(syncReminders([planned])).rejects.toThrow('keystore');
  expect(mockSchedule).not.toHaveBeenCalled();
  jest.mocked(readJsonStrict).mockResolvedValue(['sub-1']);
  mockGetAll.mockResolvedValue([{ identifier: 'st:z|1', content: { data: { subscriptionId: 'sub-1' } } }]);
  mockCancel.mockRejectedValueOnce(new Error('native rejection'));
  await expect(syncReminders([])).rejects.toThrow('native rejection');
  await syncReminders([]);
  expect(mockCancel).toHaveBeenCalledTimes(2);
});

it('değişmeyen planı yeniden zamanlamaz ve erteleme/test kaydına dokunmaz', async () => {
  mockGetAll.mockResolvedValue([existing(planned), { identifier: 'st:z|1' }, { identifier: 'st:test|1' }]);
  expect(await syncReminders([planned])).toEqual({ added: 0, removed: 0 });
  expect(mockCancel).not.toHaveBeenCalled();
  expect(mockSchedule).not.toHaveBeenCalled();
});

it.each([
  ['saat', { scheduled: new Date('2026-11-06T07:00:00.000Z') }],
  ['dilim aynı UTC anında bile', { timeZone: 'Europe/Moscow' }],
  ['başlık', { title: 'Yeni ad' }],
  ['tutar içeriği', { body: '59,90 ₺ yenileme' }],
])('%s değişince eski kaydı iptal edip yenisini planlar', async (_label, patch) => {
  mockGetAll.mockResolvedValue([existing(planned)]);
  const changed = { ...planned, ...patch };
  expect(await syncReminders([changed])).toEqual({ added: 1, removed: 1 });
  expect(mockCancel).toHaveBeenCalledWith(planned.identifier);
  expect(mockSchedule.mock.calls[0][0].content.data.planFingerprint).toBe(fingerprint(changed));
});

it('önceki sürümün parmak izi olmayan kaydını yeniler', async () => {
  mockGetAll.mockResolvedValue([{ identifier: planned.identifier, content: { data: {} } }]);
  await syncReminders([planned]);
  expect(mockCancel).toHaveBeenCalledWith(planned.identifier);
  expect(mockSchedule).toHaveBeenCalledTimes(1);
});

it('plandan çıkan eski kaydı kaldırır; erteleme kaydını korur', async () => {
  mockGetAll.mockResolvedValue([existing(planned), { identifier: 'st:z|1' }]);
  expect(await syncReminders([])).toEqual({ added: 0, removed: 1 });
  expect(mockCancel).toHaveBeenCalledTimes(1);
  expect(mockCancel).toHaveBeenCalledWith(planned.identifier);
});

it('planlama hatasını çağırana iletir; sonraki senkron yeniden dener', async () => {
  mockSchedule.mockRejectedValueOnce(new Error('OS alarm failure'));
  await expect(syncReminders([planned])).rejects.toThrow('OS alarm failure');
  await expect(syncReminders([planned])).resolves.toEqual({ added: 1, removed: 0 });
});

it('yeni kayıt kurulamazsa değişmeden önceki kaydı geri yükler', async () => {
  const prior = { identifier: planned.identifier, content: { data: { planFingerprint: 'eski' }, title: 'Eski', body: 'eski' }, trigger: { type: 'date', date: 1 } };
  mockGetAll.mockResolvedValue([prior]);
  mockSchedule.mockRejectedValueOnce(new Error('OS alarm failure'));
  await expect(syncReminders([{ ...planned, title: 'Yeni' }])).rejects.toThrow('OS alarm failure');
  expect(mockCancel).toHaveBeenCalledWith(planned.identifier);
  expect(mockSchedule).toHaveBeenLastCalledWith({ identifier: planned.identifier, content: prior.content, trigger: prior.trigger });
});
