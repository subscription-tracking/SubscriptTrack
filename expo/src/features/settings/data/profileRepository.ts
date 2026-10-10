import { supabase } from '../../../core/supabase/client';
import { DEFAULT_ACTIVE_CURRENCY, isActiveCurrency, type ActiveCurrency } from '../../../core/domain/activeCurrency';
import { type PreferredCurrency, type ProfileValues } from '../domain/profileRules';

/**
 * Profil (`profiles`). RLS yalnızca kullanıcının kendi satırına izin verir. Okuma ve kayıt
 * yalnızca kullanıcı ekranda kaydet dediğinde yapılır.
 */

export interface Profile extends ProfileValues {
  /** Profilde gerçekten bir para birimi tercihi var mı; yoksa cihazdaki seçim geçerlidir. */
  currencyStored: boolean;
  timezone: string | null;
  defaultNotifyDays: number | null;
}

interface ProfileRow {
  first_name: string | null;
  last_name: string | null;
  preferred_currency: string | null;
  timezone: string | null;
  default_notify_days: number | null;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, preferred_currency, timezone, default_notify_days')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Profil yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  const row = data as ProfileRow | null;
  const stored = isActiveCurrency(row?.preferred_currency) ? row?.preferred_currency : null;
  return {
    firstName: row?.first_name ?? '',
    lastName: row?.last_name ?? '',
    preferredCurrency: stored ?? DEFAULT_ACTIVE_CURRENCY,
    currencyStored: stored !== null && stored !== undefined,
    timezone: row?.timezone ?? null,
    defaultNotifyDays: row?.default_notify_days ?? null,
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
