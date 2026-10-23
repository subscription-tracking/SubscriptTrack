import { isValidTimeZone } from '../../../core/time/calendar';
export type TimeZoneMode = 'device' | 'fixed';
export interface TimeZonePreference { timezone: string | null; timezoneMode: TimeZoneMode }
export function decodeTimeZonePreference(value: unknown): TimeZonePreference | null {
  if (typeof value === 'string' && isValidTimeZone(value)) return { timezone: value, timezoneMode: 'fixed' };
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  return row.version === 2 && (row.mode === 'device' || row.mode === 'fixed')
    && typeof row.timezone === 'string' && isValidTimeZone(row.timezone)
    ? { timezone: row.timezone, timezoneMode: row.mode } : null;
}
export function effectiveTimeZone(preference: TimeZonePreference | null, device: string): string {
  return preference?.timezoneMode === 'fixed' && preference.timezone && isValidTimeZone(preference.timezone) ? preference.timezone : device;
}
