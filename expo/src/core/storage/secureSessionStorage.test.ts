const mockStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (value.length > 2048) throw new Error('SecureStore value too large');
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

import { CHUNK_SIZE, secureSessionStorage } from './secureSessionStorage';

beforeEach(() => mockStore.clear());

describe('secureSessionStorage', () => {
  it('kısa değeri tek kayıt olarak saklar ve geri okur', async () => {
    await secureSessionStorage.setItem('sb-token', 'kisa');
    expect(await secureSessionStorage.getItem('sb-token')).toBe('kisa');
  });

  it('sınırı aşan oturum değerini parçalara bölüp birleştirerek okur', async () => {
    const longValue = 'x'.repeat(CHUNK_SIZE * 3 + 10);
    await secureSessionStorage.setItem('sb-token', longValue);
    expect(await secureSessionStorage.getItem('sb-token')).toBe(longValue);
  });

  it('hiçbir kayıt güvenli depo sınırını (2048) aşmaz', async () => {
    const longValue = 'y'.repeat(CHUNK_SIZE * 5);
    await secureSessionStorage.setItem('sb-token', longValue);
    for (const value of mockStore.values()) {
      expect(value.length).toBeLessThanOrEqual(2048);
    }
  });

  it('değer kısaldığında eski parçaları temizler', async () => {
    await secureSessionStorage.setItem('sb-token', 'z'.repeat(CHUNK_SIZE * 2));
    await secureSessionStorage.setItem('sb-token', 'kisa');
    expect(await secureSessionStorage.getItem('sb-token')).toBe('kisa');
    expect([...mockStore.keys()].filter((k) => k.includes('.part'))).toHaveLength(0);
  });

  it('silme parçaları da kaldırır', async () => {
    await secureSessionStorage.setItem('sb-token', 'w'.repeat(CHUNK_SIZE * 2));
    await secureSessionStorage.removeItem('sb-token');
    expect(await secureSessionStorage.getItem('sb-token')).toBeNull();
    expect(mockStore.size).toBe(0);
  });

  it('eksik parça varsa değeri bozuk sayıp null döner', async () => {
    await secureSessionStorage.setItem('sb-token', 'v'.repeat(CHUNK_SIZE * 2));
    mockStore.delete('sb-token.part1');
    expect(await secureSessionStorage.getItem('sb-token')).toBeNull();
  });

  it('desteklenmeyen karakterli anahtarı güvenli biçime çevirir', async () => {
    await secureSessionStorage.setItem('sb-proje/ref:auth-token', 'deger');
    expect(mockStore.get('sb-proje_ref_auth-token')).toBe('deger');
  });
});
