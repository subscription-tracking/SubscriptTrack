import { isOnline } from './networkState';

describe('isOnline', () => {
  it('bilinmeyen durum çevrimiçi kabul edilir', () => {
    expect(isOnline(null)).toBe(true);
    expect(isOnline(undefined)).toBe(true);
    expect(isOnline({})).toBe(true);
  });

  it('bağlantı yoksa çevrimdışıdır', () => {
    expect(isOnline({ isConnected: false })).toBe(false);
  });

  it('bağlı ama internete erişilemiyorsa çevrimdışıdır', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });

  it('bağlı ve erişilebilirse çevrimiçidir', () => {
    expect(isOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
  });
});
