import { cancelAllReminders, syncReminders } from './notificationScheduler';
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

const catchUp: PlannedReminder = {
  identifier: 'st:c|sub-1|2026-10-09',
  subscriptionId: 'sub-1',
  timeZone: 'Europe/Istanbul',
  title: 'Video Plus',
  body: 'Bugün yenileniyor — 49.90 TRY · 2026-10-09',
  scheduled: new Date('2026-10-09T07:01:00.000Z'),
};
// Yedek kimliklerde zaman parmak izine girmez.
const fingerprint = (item: PlannedReminder) => JSON.stringify([item.timeZone, item.title, item.body, item.subscriptionId]);

beforeEach(() => {
  mockGetAll.mockReset().mockResolvedValue([]);
  mockCancel.mockReset().mockResolvedValue(undefined);
  mockSchedule.mockReset().mockResolvedValue(catchUp.identifier);
});

it('yedek bildirimi ilk senkronda planlar, ikinci senkronda zaman kaysa da yeniden planlamaz', async () => {
  expect(await syncReminders([catchUp])).toEqual({ added: 1, removed: 0 });
  expect(mockSchedule.mock.calls[0][0].content.data.planFingerprint).toBe(fingerprint(catchUp));

  mockGetAll.mockResolvedValue([{ identifier: catchUp.identifier, content: { data: { planFingerprint: fingerprint(catchUp) } } }]);
  const later = { ...catchUp, scheduled: new Date('2026-10-09T07:05:00.000Z') };
  expect(await syncReminders([later])).toEqual({ added: 0, removed: 0 });
  expect(mockSchedule).toHaveBeenCalledTimes(1);
});

it('işaretlendiği için artık planda olmayan bekleyen yedek bildirimi iptal etmez; normal kimlik iptal edilir', async () => {
  mockGetAll.mockResolvedValue([
    { identifier: 'st:c|sub-1|2026-10-09', content: { data: { subscriptionId: 'sub-1' } } },
    { identifier: 'st:o|sub-2|2026-10-12', content: { data: { subscriptionId: 'sub-2' } } },
    { identifier: 'st:r|sub-3|3|2026-10-12', content: { data: { subscriptionId: 'sub-3' } } },
  ]);
  expect(await syncReminders([])).toEqual({ added: 0, removed: 1 });
  expect(mockCancel.mock.calls.map(([id]) => id)).toEqual(['st:r|sub-3|3|2026-10-12']);
});

it('silinmiş abonelik kimliği yedek bildirimleri de temizler ve cancelAll hepsini kaldırır', async () => {
  mockGetAll.mockResolvedValue([
    { identifier: 'st:c|gone|2026-10-09', content: { data: { subscriptionId: 'gone' } } },
    { identifier: 'st:o|keep|2026-10-12', content: { data: { subscriptionId: 'keep' } } },
  ]);
  await syncReminders([], ['keep']);
  expect(mockCancel.mock.calls.map(([id]) => id)).toEqual(['st:c|gone|2026-10-09']);

  mockCancel.mockClear();
  mockGetAll.mockResolvedValue([{ identifier: 'st:c|a|2026-10-09' }, { identifier: 'st:o|b|2026-10-12' }, { identifier: 'baska' }]);
  expect(await cancelAllReminders()).toBe(2);
});
