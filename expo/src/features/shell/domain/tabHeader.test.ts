import { greetingFor } from './tabHeader';

describe('greetingFor', () => {
  it('görünen ad varsa adla selamlar', () => {
    expect(greetingFor({ displayName: 'Furkan' })).toBe('Merhaba, Furkan');
  });

  it('görünen ad boşsa e-posta öneki kullanılmaz; yalnızca Merhaba', () => {
    expect(greetingFor({ displayName: null })).toBe('Merhaba');
    expect(greetingFor({ displayName: '   ' })).toBe('Merhaba');
  });

  it('oturum yoksa Merhaba', () => {
    expect(greetingFor(null)).toBe('Merhaba');
  });
});
