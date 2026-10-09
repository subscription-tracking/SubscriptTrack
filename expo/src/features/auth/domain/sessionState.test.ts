import {
  INITIAL_SESSION_STATE,
  reduceSession,
  resolveRedirect,
  type SessionSnapshot,
  type SessionState,
} from './sessionState';

const session: SessionSnapshot = {
  user: {
    id: 'user-1',
    email: 'furkan@ornek.com',
    created_at: '2026-10-01T10:00:00Z',
    user_metadata: { display_name: 'Furkan' },
  },
};

const authenticated: SessionState = {
  status: 'authenticated',
  user: {
    id: 'user-1',
    email: 'furkan@ornek.com',
    displayName: 'Furkan',
    createdAt: '2026-10-01T10:00:00Z',
  },
  passwordRecoveryMode: false,
};

const recovery: SessionState = { ...authenticated, passwordRecoveryMode: true };
const unauthenticated: SessionState = { status: 'unauthenticated', user: null, passwordRecoveryMode: false };

describe('reduceSession', () => {
  it('INITIAL_SESSION oturum yoksa unauthenticated olur', () => {
    expect(reduceSession(INITIAL_SESSION_STATE, 'INITIAL_SESSION', null).status).toBe('unauthenticated');
  });

  it('SIGNED_IN oturumdan kullanıcıyı çıkarır', () => {
    const next = reduceSession(INITIAL_SESSION_STATE, 'SIGNED_IN', session);
    expect(next.status).toBe('authenticated');
    expect(next.user).toEqual({
      id: 'user-1',
      email: 'furkan@ornek.com',
      displayName: 'Furkan',
      createdAt: '2026-10-01T10:00:00Z',
    });
  });

  it('PASSWORD_RECOVERY kurtarma modunu açar', () => {
    const next = reduceSession(authenticated, 'PASSWORD_RECOVERY', session);
    expect(next.passwordRecoveryMode).toBe(true);
    expect(next.status).toBe('authenticated');
  });

  it('USER_UPDATED kurtarma modunu kapatır', () => {
    expect(reduceSession(recovery, 'USER_UPDATED', session).passwordRecoveryMode).toBe(false);
  });

  it('SIGNED_OUT her şeyi sıfırlar', () => {
    expect(reduceSession(recovery, 'SIGNED_OUT', null)).toEqual(unauthenticated);
  });

  it('oturum yokken kurtarma modu kalmaz', () => {
    expect(reduceSession(recovery, 'TOKEN_REFRESHED', null).passwordRecoveryMode).toBe(false);
  });
});

describe('resolveRedirect', () => {
  it('tanıtım görülmediyse oturum yokken onboarding ekranına yönlendirir', () => {
    expect(resolveRedirect(unauthenticated, '(auth)', 'login', true)).toBe('/onboarding');
    expect(resolveRedirect(unauthenticated, '(app)', undefined, true)).toBe('/onboarding');
  });

  it('onboarding ekranı ve yasal sayfalar tanıtım beklemez', () => {
    expect(resolveRedirect(unauthenticated, '(auth)', 'onboarding', true)).toBeNull();
    expect(resolveRedirect(unauthenticated, 'legal', 'privacy', true)).toBeNull();
  });

  it('tanıtım görüldüyse davranış değişmez', () => {
    expect(resolveRedirect(unauthenticated, '(app)', undefined, false)).toBe('/login');
  });

  it('durum bilinmiyorsa yönlendirme yapmaz (yükleniyor)', () => {
    expect(resolveRedirect(INITIAL_SESSION_STATE, '(auth)', 'login')).toBeNull();
  });

  it('oturum yokken uygulama ekranlarından giriş ekranına yönlendirir', () => {
    expect(resolveRedirect(unauthenticated, '(app)')).toBe('/login');
    expect(resolveRedirect(unauthenticated, undefined)).toBe('/login');
  });

  it('oturum yokken auth ekranları ve callback açıktır', () => {
    expect(resolveRedirect(unauthenticated, '(auth)', 'register')).toBeNull();
    expect(resolveRedirect(unauthenticated, 'auth-callback')).toBeNull();
  });

  it('oturum açıkken auth ekranından ana sayfaya yönlendirir', () => {
    expect(resolveRedirect(authenticated, '(auth)', 'login')).toBe('/');
    expect(resolveRedirect(authenticated, 'auth-callback')).toBe('/');
  });

  it('yasal sayfalar oturum durumundan bağımsız açıktır', () => {
    expect(resolveRedirect(unauthenticated, 'legal', 'terms')).toBeNull();
    expect(resolveRedirect(authenticated, 'legal', 'privacy')).toBeNull();
  });

  it('oturum açıkken uygulama ekranında kalır', () => {
    expect(resolveRedirect(authenticated, '(app)')).toBeNull();
  });

  it('kurtarma modunda reset-password dışındaki her ekran oraya gönderir', () => {
    expect(resolveRedirect(recovery, '(app)')).toBe('/reset-password');
    expect(resolveRedirect(recovery, 'auth-callback')).toBe('/reset-password');
    expect(resolveRedirect(recovery, '(auth)', 'login')).toBe('/reset-password');
  });

  it('kurtarma modunda reset-password ekranında kalır', () => {
    expect(resolveRedirect(recovery, '(auth)', 'reset-password')).toBeNull();
  });
});
