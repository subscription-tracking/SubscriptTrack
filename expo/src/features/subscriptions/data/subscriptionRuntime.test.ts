import { getNetworkStateAsync } from 'expo-network';
import { deviceConnection } from './subscriptionRuntime';

jest.mock('expo-network', () => ({ getNetworkStateAsync: jest.fn() }));
jest.mock('../../../core/supabase/client', () => ({ supabase: {} }));

describe('deviceConnection', () => {
  it('algılama hatasını çevrimiçi kanıtı saymaz', async () => {
    jest.mocked(getNetworkStateAsync).mockRejectedValueOnce(new Error('native unavailable'));
    expect(await deviceConnection()).toBe('unknown');
  });

  it.each([
    [true, true, 'online'],
    [true, undefined, 'unknown'],
    [false, undefined, 'offline'],
    [true, false, 'offline'],
  ])('bağlantı %s, erişim %s → %s', async (connected, reachable, expected) => {
    jest.mocked(getNetworkStateAsync).mockResolvedValueOnce({
      isConnected: connected, isInternetReachable: reachable,
    } as Awaited<ReturnType<typeof getNetworkStateAsync>>);
    expect(await deviceConnection()).toBe(expected);
  });
});
