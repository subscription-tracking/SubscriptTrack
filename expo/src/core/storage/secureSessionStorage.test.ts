import * as SecureStore from 'expo-secure-store';
import { CHUNK_SIZE, secureSessionStorage } from './secureSessionStorage';

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
    mockStore.delete([...mockStore.keys()].find((k) => k.endsWith('.part1'))!);
    expect(await secureSessionStorage.getItem('sb-token')).toBeNull();
  });

  it('kritik okumada eksik parça veya geçersiz parça sayısı hata verir', async () => {
    await secureSessionStorage.setItem('queue', 'v'.repeat(CHUNK_SIZE * 2));
    mockStore.delete([...mockStore.keys()].find((k) => k.endsWith('.part1'))!);
    await expect(secureSessionStorage.getItem('queue', true)).rejects.toThrow('parçası eksik');
    mockStore.set('queue', '__chunks__:NaN');
    await expect(secureSessionStorage.getItem('queue', true)).rejects.toThrow('parça bilgisi');
  });

  it('desteklenmeyen karakterli anahtarı güvenli biçime çevirir', async () => {
    await secureSessionStorage.setItem('sb-proje/ref:auth-token', 'deger');
    expect(mockStore.get('sb-proje_ref_auth-token')).toBe('deger');
  });

  it('yeni biçimde başlığı nesil bilgisiyle yazar ve round-trip okur', async () => {
    const value = 'a'.repeat(CHUNK_SIZE * 2 + 5);
    await secureSessionStorage.setItem('k', value);
    expect(mockStore.get('k')).toMatch(/^__chunks__:3:[0-9a-z]+$/);
    expect(await secureSessionStorage.getItem('k', true)).toBe(value);
  });

  it('eski biçimi (__chunks__:N ve key.part<i>) okur ve yeni yazımda temizler', async () => {
    mockStore.set('k', '__chunks__:2');
    mockStore.set('k.part0', 'ab');
    mockStore.set('k.part1', 'cd');
    expect(await secureSessionStorage.getItem('k', true)).toBe('abcd');
    await secureSessionStorage.setItem('k', 'b'.repeat(CHUNK_SIZE + 1));
    expect(mockStore.has('k.part0')).toBe(false);
    expect(mockStore.has('k.part1')).toBe(false);
    expect(await secureSessionStorage.getItem('k')).toBe('b'.repeat(CHUNK_SIZE + 1));
  });

  it('yazma ortasında hata olursa eski değer okunur ve yarım parçalar temizlenir', async () => {
    const oldValue = 'o'.repeat(CHUNK_SIZE * 2);
    await secureSessionStorage.setItem('k', oldValue);
    const before = new Set(mockStore.keys());
    const setItem = SecureStore.setItemAsync as jest.Mock;
    const original = setItem.getMockImplementation()!;
    let calls = 0;
    setItem.mockImplementation(async (key: string, value: string) => {
      calls += 1;
      if (calls === 2) throw new Error('disk dolu');
      return original(key, value);
    });
    await expect(secureSessionStorage.setItem('k', 'n'.repeat(CHUNK_SIZE * 3))).rejects.toThrow('disk dolu');
    setItem.mockImplementation(original);
    expect(await secureSessionStorage.getItem('k', true)).toBe(oldValue);
    expect(new Set(mockStore.keys())).toEqual(before);
  });

  it('aynı anahtara eşzamanlı yazımlar sırayla uygulanır', async () => {
    const a = 'a'.repeat(CHUNK_SIZE * 2);
    const b = 'b'.repeat(CHUNK_SIZE * 2);
    await Promise.all([secureSessionStorage.setItem('k', a), secureSessionStorage.setItem('k', b)]);
    expect(await secureSessionStorage.getItem('k', true)).toBe(b);
    expect([...mockStore.keys()].filter((k) => k.includes('.part'))).toHaveLength(2);
  });
});
