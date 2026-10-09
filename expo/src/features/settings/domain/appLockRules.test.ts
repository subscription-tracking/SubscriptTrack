import { FREE_ATTEMPTS, MAX_LOCKOUT_MS, isValidPin, lockoutMs, shouldLockOnResume } from './appLockRules';

describe('isValidPin', () => {
  it('4–8 rakamı kabul eder', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
  });

  it('kısa, uzun, harf içeren ve boş PIN\'i reddeder', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('123456789')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });
});

describe('lockoutMs', () => {
  it('ilk serbest denemelerde bekleme yoktur', () => {
    expect(lockoutMs(FREE_ATTEMPTS - 1)).toBe(0);
  });

  it('sonra üstel artar ve 15 dakikada sınırlanır', () => {
    expect(lockoutMs(FREE_ATTEMPTS)).toBe(30_000);
    expect(lockoutMs(FREE_ATTEMPTS + 1)).toBe(60_000);
    expect(lockoutMs(FREE_ATTEMPTS + 30)).toBe(MAX_LOCKOUT_MS);
  });
});

describe('shouldLockOnResume', () => {
  const minute = 60_000;

  it('arka plana geçilmediyse kilitlemez', () => {
    expect(shouldLockOnResume(null, 1000, minute)).toBe(false);
  });

  it('süre dolmadan dönüşte kilitlemez, dolunca kilitler', () => {
    expect(shouldLockOnResume(0, 30_000, minute)).toBe(false);
    expect(shouldLockOnResume(0, minute, minute)).toBe(true);
  });

  it('saat geri alındıysa kilitler', () => {
    expect(shouldLockOnResume(10_000, 5_000, minute)).toBe(true);
  });
});
