import { supabase } from '../../../core/supabase/client';
import { env } from '../../../core/config/env';
import { type TimeZoneMode } from '../domain/timeZonePreference';
import { DEFAULT_ACTIVE_CURRENCY, isActiveCurrency, type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { isValidTimeZone } from '../../../core/time/calendar';
import { removeJson, writeJson } from '../../../core/storage/secureJsonStore';
import { type PreferredCurrency, type ProfileValues } from '../domain/profileRules';

/**
 * Profil (`profiles`). RLS yalnızca kullanıcının kendi satırına izin verir. Okuma ve kayıt
 * yalnızca kullanıcı ekranda kaydet dediğinde yapılır.
 */

export interface Profile extends ProfileValues {
  /** Profilde gerçekten bir para birimi tercihi var mı; yoksa cihazdaki seçim geçerlidir. */
  currencyStored: boolean;
  timezone: string | null;
  timezoneMode?: TimeZoneMode;
  defaultNotifyDays: number | null;
  notificationsEnabled: boolean | null;
}

/** Kullanıcı hesabına ayrılmış çevrimdışı IANA tercihi; başka hesaba taşınamaz. */
export const profileTimeZoneCacheKey = (userId: string) => `profile.timezone.${userId}`;

interface ProfileRow {
  timezone_mode?: TimeZoneMode;
  first_name: string | null;
  last_name: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  default_notify_days: number | null;
  push_enabled: boolean | null;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(env.timezoneModeEnabled ? 'first_name, last_name, preferred_currency, timezone, default_notify_days, push_enabled, timezone_mode' : 'first_name, last_name, preferred_currency, timezone, default_notify_days, push_enabled')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Profil yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  const row = data as unknown as ProfileRow | null;
  const stored = isActiveCurrency(row?.preferred_currency) ? row?.preferred_currency : null;
  const timeZone = row?.timezone && isValidTimeZone(row.timezone) ? row.timezone : null;
  const timezoneMode = row?.timezone_mode === 'device' ? 'device' : 'fixed';
  if (timeZone) await writeJson(profileTimeZoneCacheKey(userId), env.timezoneModeEnabled ? { version: 2, timezone: timeZone, mode: timezoneMode } : timeZone).catch(() => undefined);
  else await removeJson(profileTimeZoneCacheKey(userId)).catch(() => undefined);
  return {
    firstName: row?.first_name ?? '',
    lastName: row?.last_name ?? '',
    preferredCurrency: stored ?? DEFAULT_ACTIVE_CURRENCY,
    currencyStored: stored !== null && stored !== undefined,
    timezone: timeZone,
    timezoneMode,
    defaultNotifyDays: row?.default_notify_days ?? null,
    notificationsEnabled: row?.push_enabled ?? null,
  };
}

export async function saveProfile(userId: string, values: { firstName: string; lastName: string; preferredCurrency: PreferredCurrency }): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: userId,
      first_name: values.firstName.trim() || null,
      last_name: values.lastName.trim() || null,
      preferred_currency: values.preferredCurrency,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error('Profil kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
}

/** Yalnızca para birimi tercihini yazar; ad ve soyad değişmez (kısmi upsert). */
export async function saveActiveCurrency(userId: string, currency: ActiveCurrency): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, preferred_currency: currency }, { onConflict: 'user_id' });
  if (error) throw new Error('Para birimi kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
}

/** Profil IANA bölgesini kaydeder; istemci cihaz bölgesini yalnız ilk öneri olarak kullanır. */
export async function saveUserTimeZone(userId: string, timeZone: string): Promise<void> {
  if (!isValidTimeZone(timeZone)) throw new Error('Geçerli bir saat dilimi seç.');
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, timezone: timeZone, ...(env.timezoneModeEnabled ? { timezone_mode: 'fixed' } : {}) }, { onConflict: 'user_id' });
  if (error) throw new Error('Saat dilimi kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  await writeJson(profileTimeZoneCacheKey(userId), env.timezoneModeEnabled ? { version: 2, timezone: timeZone, mode: 'fixed' } : timeZone).catch(() => undefined);
}

export async function saveTimeZoneMode(userId: string, mode: TimeZoneMode, timeZone: string) {
  if (!env.timezoneModeEnabled) throw new Error('Saat dilimi seçimi şu an kullanılamıyor. Daha sonra tekrar dene.');
  if (!isValidTimeZone(timeZone)) throw new Error('Geçerli bir saat dilimi seç.');
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, timezone_mode: mode, timezone: timeZone }, { onConflict: 'user_id' });
  if (error) throw new Error('Saat dilimi tercihi kaydedilemedi. Tekrar dene.');
  await writeJson(profileTimeZoneCacheKey(userId), { version: 2, timezone: timeZone, mode });
}
