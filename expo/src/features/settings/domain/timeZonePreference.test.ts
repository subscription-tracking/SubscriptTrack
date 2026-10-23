import { decodeTimeZonePreference, effectiveTimeZone } from './timeZonePreference';
it('preserves legacy fixed IANA preferences', () => {
  expect(effectiveTimeZone(decodeTimeZonePreference('Europe/Istanbul'), 'America/New_York')).toBe('Europe/Istanbul');
});
it('device mode follows each device while fixed mode survives device changes', () => {
  const device = decodeTimeZonePreference({ version: 2, mode: 'device', timezone: 'Europe/Istanbul' });
  expect(effectiveTimeZone(device, 'America/New_York')).toBe('America/New_York');
  expect(effectiveTimeZone(device, 'Europe/Paris')).toBe('Europe/Paris');
  expect(decodeTimeZonePreference({ version: 2, mode: 'invalid', timezone: 'Europe/Istanbul' })).toBeNull();
});
