import { notificationText, parseKind, unreadCount } from './notificationCenter';

describe('notificationText', () => {
  it('başlık abonelik adı, gövde kalan süre', () => {
    expect(notificationText('renewal_today', { name: 'Netflix' })).toEqual({
      title: 'Netflix',
      body: 'Bugün yenileniyor',
    });
    expect(notificationText('renewal_soon', { name: 'Spotify', days: 3 })).toEqual({
      title: 'Spotify',
      body: 'Yenilenmesine 3 gün kaldı',
    });
  });

  it('başlık ve gövde aynı bilgiyi tekrar etmez', () => {
    const text = notificationText('renewal_soon', { name: 'Xbox', days: 1 });
    expect(text.body).not.toContain(text.title);
  });

  it('deneme metinleri', () => {
    expect(notificationText('trial_soon', { name: 'BluTV', days: 1 })).toEqual({
      title: 'BluTV',
      body: 'Denemenin bitmesine 1 gün kaldı',
    });
  });

  it('ad yoksa tür adı başlık olur', () => {
    expect(notificationText('renewal_upcoming', {})).toEqual({ title: 'Abonelik', body: '0 gün içinde yenilenecek' });
    expect(notificationText('trial_upcoming', { days: 2 }).title).toBe('Ücretsiz deneme');
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
    expect(unreadCount([
      { id: 'one', readAt: null },
      { id: 'two', readAt: '2026-10-09T10:00:00Z' },
      { id: 'three', readAt: null },
    ])).toBe(2);
  });

  it('yerelde okunan ve kapatılanları sunucu yanıtını beklemeden rozetten çıkarır', () => {
    const rows = [
      { id: 'read-here', readAt: null },
      { id: 'dismissed-here', readAt: null },
      { id: 'unread', readAt: null },
      { id: 'read-on-server', readAt: '2026-10-09T10:00:00Z' },
    ];

    expect(unreadCount(rows, new Set(['read-here']), new Set(['dismissed-here']))).toBe(1);
  });
});
