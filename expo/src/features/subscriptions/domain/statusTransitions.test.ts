import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from './subscription';
import { actionsFor, canTransition } from './statusTransitions';

describe('canTransition', () => {
  it('Flutter ve DOMAIN §3 izin tablosunu uygular', () => {
    expect(canTransition('active', 'paused')).toBe(true);
    expect(canTransition('paused', 'active')).toBe(true);
    expect(canTransition('archived', 'active')).toBe(true);
    expect(canTransition('cancelled', 'active')).toBe(false);
    expect(canTransition('trial', 'paused')).toBe(false);
    expect(canTransition('expired', 'paused')).toBe(false);
    expect(canTransition('archived', 'paused')).toBe(false);
  });

  it('aynı durumdan aynı duruma geçiş yoktur', () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});

describe('actionsFor', () => {
  it('her aksiyonun hedefi kaynak durumdan izinlidir', () => {
    for (const from of SUBSCRIPTION_STATUSES) {
      for (const spec of actionsFor(from)) {
        expect(canTransition(from, spec.target)).toBe(true);
      }
    }
  });

  it('aktif kayıtta duraklat, iptal ve arşiv sunulur', () => {
    expect(actionsFor('active').map((spec) => spec.action)).toEqual(['pause', 'cancel', 'archive']);
  });

  it('arşivde yalnızca geri alma sunulur', () => {
    expect(actionsFor('archived').map((spec) => spec.action)).toEqual(['restore']);
  });

  it('duraklatılmışta devam ettir, deneme ve süresi dolmuşta aktif yap sunulur', () => {
    expect(actionsFor('paused').map((spec) => spec.action)).toContain('resume');
    expect(actionsFor('trial').map((spec) => spec.action)).toContain('activate');
    expect(actionsFor('expired').map((spec) => spec.action)).toContain('activate');
  });

  it('iptal ve arşiv yıkıcı olarak işaretlenir', () => {
    const active = actionsFor('active');
    expect(active.find((spec) => spec.action === 'cancel')?.destructive).toBe(true);
    expect(active.find((spec) => spec.action === 'archive')?.destructive).toBe(true);
  });

  it('iptal edilmiş kayıtta yalnızca arşiv sunulur', () => {
    const from: SubscriptionStatus = 'cancelled';
    expect(actionsFor(from).map((spec) => spec.action)).toEqual(['archive']);
  });
});
