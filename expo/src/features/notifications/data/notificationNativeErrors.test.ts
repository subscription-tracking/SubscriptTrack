import type { NotificationResponse } from 'expo-notifications';
import { Platform } from 'react-native';
import { configureNotifications, requestPermissionState } from './notificationRuntime';
import { getLaunchTapSubscriptionId, subscribeToTaps } from './notificationResponses';
const mockCategory = jest.fn();
const mockChannel = jest.fn();
const mockPermissions = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();
const mockGetAll = jest.fn();
const mockLast = jest.fn();
const mockClear = jest.fn();
let mockListener: (response: NotificationResponse) => void;
const mockRead = jest.fn();
jest.mock('../../../core/storage/secureJsonStore', () => ({ readJsonStrict: (...args: unknown[]) => mockRead(...args) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'bare' }, ExecutionEnvironment: { StoreClient: 'storeClient' } }));
jest.mock('expo-notifications', () => ({
  setNotificationCategoryAsync: (...args: unknown[]) => mockCategory(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockChannel(...args), setNotificationHandler: jest.fn(), AndroidImportance: { DEFAULT: 3 },
  requestPermissionsAsync: (...args: unknown[]) => mockPermissions(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) => mockGetAll(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  addNotificationResponseReceivedListener: (callback: (response: NotificationResponse) => void) => { mockListener = callback; return { remove: jest.fn() }; },
  getLastNotificationResponseAsync: () => mockLast(), clearLastNotificationResponseAsync: () => mockClear(),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));
let responseSequence = 0;
const response = (actionIdentifier = 'snooze') => ({ actionIdentifier, notification: { date: ++responseSequence, request: { identifier: 'st:r|sub|0|2026-10-12', content: { title: 'Name', body: '10 TRY 2026-10-12', data: { subscriptionId: 'sub' } } } } }) as unknown as NotificationResponse;
const flush = async () => { for (let i=0;i<15;i++) await Promise.resolve(); };
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  jest.clearAllMocks(); mockCategory.mockResolvedValue(undefined);mockChannel.mockResolvedValue(undefined);
  mockPermissions.mockResolvedValue({ status: 'granted' });mockSchedule.mockResolvedValue('id');
  mockCancel.mockResolvedValue(undefined);mockGetAll.mockResolvedValue([]);mockRead.mockResolvedValue(null);mockClear.mockResolvedValue(undefined);
});
it('propagates category/channel/permission rejection to the caller', async () => {
  mockCategory.mockRejectedValueOnce(new Error('category rejected'));
  await expect(configureNotifications()).rejects.toThrow('category rejected');
  mockChannel.mockRejectedValueOnce(new Error('channel rejected'));
  await expect(configureNotifications()).rejects.toThrow('channel rejected');
  mockPermissions.mockRejectedValueOnce(new Error('permission rejected'));
  await expect(requestPermissionState()).rejects.toThrow('permission rejected');
});
it('snoozes for 30 minutes, avoids deleted records, and reports native errors', async () => {
  const onError=jest.fn();subscribeToTaps(jest.fn(),onError);
  mockListener(response());await flush();
  expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ seconds: 1800 }) }));
  mockRead.mockResolvedValue(['sub']);mockSchedule.mockClear();mockListener(response());await flush();expect(mockSchedule).not.toHaveBeenCalled();
  mockRead.mockResolvedValue(null);mockSchedule.mockRejectedValueOnce(new Error('snooze rejected'));mockListener(response());await flush();
  expect(onError).toHaveBeenCalledWith(expect.any(Error));
});
it('makes room for snooze within 60 and preserves other snoozes', async () => {
  mockGetAll.mockResolvedValue([
    ...Array.from({length:59},(_,index)=>({ identifier:`st:z|${index}` })),
    { identifier:'st:r|farthest', trigger:{ date:999999 } },
  ]);
  subscribeToTaps(jest.fn());mockListener(response());await flush();
  expect(mockCancel).toHaveBeenCalledWith('st:r|farthest');expect(mockSchedule).toHaveBeenCalledTimes(1);
});
it('routes taps and clears cold-start response, while cold snooze does not route', async () => {
  const tap=jest.fn();subscribeToTaps(tap);mockListener(response('default'));expect(tap).toHaveBeenCalledWith('sub');
  mockLast.mockResolvedValue(response('default'));expect(await getLaunchTapSubscriptionId()).toBe('sub');expect(mockClear).toHaveBeenCalledTimes(1);
  mockLast.mockResolvedValue(response());expect(await getLaunchTapSubscriptionId()).toBeNull();
});
