import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type ActiveCurrency, resolveActiveCurrency } from '../../../core/domain/activeCurrency';
import { deviceTimeZone, isValidTimeZone } from '../../../core/time/calendar';
import { readJson } from '../../../core/storage/secureJsonStore';
import { useAuth } from '../../auth/AuthProvider';
import { readDeviceCurrency, writeDeviceCurrency } from '../../onboarding/data/currencyPreference';
import { fetchProfile, profileTimeZoneCacheKey, saveActiveCurrency, saveUserTimeZone, saveTimeZoneMode, type Profile } from './profileRepository';
import { decodeTimeZonePreference, effectiveTimeZone, type TimeZoneMode } from '../domain/timeZonePreference';

const profileKey = (userId: string | undefined) => ['profile', userId ?? ''] as const;
const deviceKey = ['device-currency'] as const;
const profileTimeZoneCacheQueryKey = (userId: string | undefined) => ['profile-timezone-cache', userId ?? ''] as const;

/**
 * Kullanıcının tercih ettiği para birimi. Profilde kayıtlı tercih varsa o, yoksa cihazdaki son seçim, o da yoksa
 * TRY. Ekranlar bunu sıralama ve varsayılan için kullanır; kayıt gizlemek için kullanmaz.
 */
export function useActiveCurrency(): ActiveCurrency {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: profileKey(user?.id),
    queryFn: () => fetchProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const device = useQuery({ queryKey: deviceKey, queryFn: readDeviceCurrency, staleTime: Infinity });
  const stored = profile.data?.currencyStored ? profile.data.preferredCurrency : null;
  return resolveActiveCurrency(stored, device.data);
}

/** Profil IANA bölgesi önceliklidir; çevrimdışıyken kullanıcıya ayrılmış güvenli kopya kullanılır. */
export function useUserTimeZoneState(): { timeZone: string; ready: boolean; mode: TimeZoneMode } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deviceZone, setDeviceZone] = useState(deviceTimeZone);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setDeviceZone(deviceTimeZone()); });
    return () => subscription.remove();
  }, []);
  const profile = useQuery({
    queryKey: profileKey(user?.id),
    queryFn: () => fetchProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const local = useQuery({
    queryKey: profileTimeZoneCacheQueryKey(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const value = await readJson(profileTimeZoneCacheKey(user.id));
      return decodeTimeZonePreference(value);
    },
    enabled: Boolean(user),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (user && profile.data) {
      queryClient.setQueryData(profileTimeZoneCacheQueryKey(user.id), { timezone: profile.data.timezone, timezoneMode: profile.data.timezoneMode ?? 'fixed' });
    }
  }, [profile.data, queryClient, user]);

  const profileZone = profile.data?.timezone;
  const cachedZone = local.data?.timezone;
  const preference = profile.data ? { timezone: profileZone ?? null, timezoneMode: profile.data.timezoneMode ?? 'fixed' as const } : local.data ?? null;
  const timeZone = effectiveTimeZone(preference, deviceZone);
  const ready = !user || Boolean(
    (profile.data && profileZone && isValidTimeZone(profileZone)) ||
    (cachedZone && isValidTimeZone(cachedZone)) ||
    (!profile.isPending && !local.isPending),
  );
  return { timeZone, ready, mode: preference?.timezoneMode ?? 'device' };
}

/** Profil tercihi, ardından kullanıcıya özel güvenli önbellek; son varsayılan cihaz IANA bölgesidir. */
export function useUserTimeZone(): string {
  return useUserTimeZoneState().timeZone;
}

export function useSetUserTimeZone() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (timeZone: string) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      await saveUserTimeZone(user.id, timeZone);
    },
    onSuccess: async (_result, timeZone) => {
      if (!user) return;
      queryClient.setQueryData<Profile | undefined>(profileKey(user.id), (current) => current ? { ...current, timezone: timeZone, timezoneMode: 'fixed' } : current);
      queryClient.setQueryData(profileTimeZoneCacheQueryKey(user.id), { timezone: timeZone, timezoneMode: 'fixed' });
      await queryClient.invalidateQueries({ queryKey: profileKey(user.id) });
    },
  });
}

export function useSetTimeZoneMode() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (mode: TimeZoneMode) => {
      if (!user) throw new Error('Oturum bulunamadı.');
      await saveTimeZoneMode(user.id, mode, deviceTimeZone());
    },
    onSuccess: async () => { if (user) await client.invalidateQueries({ queryKey: profileKey(user.id) }); },
  });
}

/** Aktif para birimini değiştirir: cihazda ve (oturum varsa) profilde saklar; ilgili önbellek yenilenir. */
export function useSetActiveCurrency() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currency: ActiveCurrency) => {
      await writeDeviceCurrency(currency);
      if (user) await saveActiveCurrency(user.id, currency);
    },
    onSuccess: async (_result, currency) => {
      queryClient.setQueryData(deviceKey, currency);
      if (user) await queryClient.invalidateQueries({ queryKey: profileKey(user.id) });
    },
  });
}
