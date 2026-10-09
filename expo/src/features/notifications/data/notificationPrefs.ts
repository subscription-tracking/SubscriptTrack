import { useQuery, useQueryClient } from '@tanstack/react-query';

import { readJson, writeJson } from '../../../core/storage/secureJsonStore';

/**
 * Bildirim tercihleri: yerel (şifreli) depo. `profiles.default_notify_days` ve `push_enabled`
 * sunucu alanlarıdır; bu sürüm bunları henüz okuyup yazmaz (canlı veri yazımı onay gerektirir).
 * Sunucu eşitlemesi ayrı bir kararla eklenecek.
 */

export interface NotifyPrefs {
  enabled: boolean;
  /** Kayıtta kural yoksa kullanılan gün sayısı (0–30). Veritabanı varsayılanı 3. */
  defaultDays: number;
}

export const DEFAULT_PREFS: NotifyPrefs = { enabled: true, defaultDays: 3 };
export const DEFAULT_DAYS_OPTIONS = [0, 1, 3, 7] as const;

const KEY = 'notifications.prefs';

export const notifyPrefsKey = ['notification-prefs'] as const;

export function sanitizePrefs(value: unknown): NotifyPrefs {
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFS;
  const record = value as Record<string, unknown>;
  const days = typeof record.defaultDays === 'number' && Number.isInteger(record.defaultDays) ? record.defaultDays : DEFAULT_PREFS.defaultDays;
  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : DEFAULT_PREFS.enabled,
    defaultDays: Math.min(30, Math.max(0, days)),
  };
}

export async function loadPrefs(): Promise<NotifyPrefs> {
  return sanitizePrefs(await readJson(KEY));
}

export async function savePrefs(prefs: NotifyPrefs): Promise<void> {
  await writeJson(KEY, sanitizePrefs(prefs));
}

export function useNotifyPrefs() {
  return useQuery({ queryKey: notifyPrefsKey, queryFn: loadPrefs, staleTime: Infinity });
}

/** Tercihi kaydeder ve sorguyu günceller. */
export function useSetNotifyPrefs() {
  const queryClient = useQueryClient();
  return async (next: NotifyPrefs) => {
    await savePrefs(next);
    queryClient.setQueryData(notifyPrefsKey, sanitizePrefs(next));
  };
}
