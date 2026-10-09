import { notificationText, parseKind, unreadCount } from './notificationCenter';

describe('notificationText', () => {
  it('yenileme metinlerini Flutter ile aynı üretir', () => {
    expect(notificationText('renewal_today', { name: 'Netflix' })).toEqual({
      title: 'Bugün yenileniyor',
      body: 'Netflix bugün yenileniyor.',
    });
    expect(notificationText('renewal_soon', { name: 'Spotify', days: 3 })).toEqual({
      title: '3 gün kaldı',
      body: 'Spotify 3 gün içinde yenileniyor.',
    });
  });

  it('deneme metinlerini üretir', () => {
    expect(notificationText('trial_soon', { name: 'BluTV', days: 1 }).body).toBe('BluTV ücretsiz denemesi 1 gün içinde sona eriyor.');
  });

  it('eksik parametrede boş ad ve sıfır gün kullanır', () => {
    expect(notificationText('renewal_upcoming', {})).toEqual({
      title: 'Yaklaşan yenileme',
      body: ' 0 gün içinde yenileniyor.',
    });
  });
});

describe('parseKind', () => {
  it('bilinmeyen türü null döner', () => {
    expect(parseKind('renewal_soon')).toBe('renewal_soon');
    expect(parseKind('price_changed')).toBeNull();
  });
});

describe('unreadCount', () => {
  it('okunmamış (readAt boş) kayıtları sayar', () => {
    expect(unreadCount([{ readAt: null }, { readAt: '2026-10-09T10:00:00Z' }, { readAt: null }])).toBe(2);
  });
});
