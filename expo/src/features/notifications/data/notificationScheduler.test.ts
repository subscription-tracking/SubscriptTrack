import { notificationsModule, notificationsSupported } from './notificationRuntime';
let mockPlatform = 'android';
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return Object.create(actual, { Platform: { value: { ...actual.Platform, get OS() { return mockPlatform; } } } });
});

jest.mock('expo-notifications', () => { throw new Error('Remote push entry must not load in Go'); });

jest.mock('./localNotifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'storeClient' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

describe('notificationScheduler native module loading', () => {
  it('loads local notifications in Expo Go without requiring remote push', () => {
    expect(notificationsModule()).not.toBeNull();
    expect(notificationsSupported()).toBe(true);
  });

  it.each(['android', 'ios'])('supports local permissions in Expo Go on %s', async (os) => {
    const original = mockPlatform;
    mockPlatform = os;
    try {
      await jest.isolateModulesAsync(async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const runtime = require('./notificationRuntime') as typeof import('./notificationRuntime');
        expect(runtime.notificationsSupported()).toBe(true);
        await expect(runtime.getPermissionState()).resolves.toBe('granted');
      });
    } finally { mockPlatform = original; }
  });

});
