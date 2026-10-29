import { greetingFor, homeDateLabel } from './tabHeader';
import { zoneToday } from '../../../core/time/calendar';

it('başlık gününü cihaz bölgesinden bağımsız seçili IANA bölgesinden alır', () => {
  const instant = new Date('2026-10-28T22:30:00Z');
  expect(homeDateLabel(zoneToday('Europe/Istanbul', instant))).toBe('29 Ekim Perşembe');
  expect(homeDateLabel(zoneToday('UTC', instant))).toBe('28 Ekim Çarşamba');
});

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
