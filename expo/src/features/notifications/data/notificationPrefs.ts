import { useQuery, useQueryClient } from '@tanstack/react-query';

import { readJson, writeJson } from '../../../core/storage/secureJsonStore';
import { supabase } from '../../../core/supabase/client';
import { useAuth } from '../../auth/AuthProvider';
import { fetchProfile } from '../../settings/data/profileRepository';

/**
 * Gün ve etkinlik tercihi profilde, saat tercihi Auth kullanıcı meta verisinde tutulur.
 * Üçü de aynı hesaba giriş yapılan cihazlar arasında paylaşılır.
 */

export interface NotifyPrefs {
  enabled: boolean;
  /** Kayıtta kural yoksa kullanılan gün sayısı (0–30). Veritabanı varsayılanı 3. */
  defaultDays: number;
  /** Hatırlatmanın gönderileceği yerel saat (0–23). Flutter `reminderHour` ile aynı; varsayılan 9. */
  reminderHour: number;
}

export const DEFAULT_PREFS: NotifyPrefs = { enabled: true, defaultDays: 3, reminderHour: 9 };
/** Flutter bildirim tercihi ekranındaki seçenekler. */
export const DEFAULT_DAYS_OPTIONS = [1, 3, 7] as const;

const keyFor = (userId: string) => `notifications.prefs.${userId}`;

export const notifyPrefsKey = (userId: string | undefined) => ['notification-prefs', userId ?? ''] as const;

export function sanitizePrefs(value: unknown): NotifyPrefs {
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFS;
  const record = value as Record<string, unknown>;
  const days = typeof record.defaultDays === 'number' && Number.isInteger(record.defaultDays) ? record.defaultDays : DEFAULT_PREFS.defaultDays;
  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : DEFAULT_PREFS.enabled,
    defaultDays: Math.min(30, Math.max(0, days)),
    reminderHour: typeof record.reminderHour === 'number' && Number.isInteger(record.reminderHour) ? Math.min(23, Math.max(0, record.reminderHour)) : DEFAULT_PREFS.reminderHour,
  };
}

export async function loadPrefs(userId: string): Promise<NotifyPrefs> {
  const local = sanitizePrefs(await readJson(keyFor(userId)));
  let remote: Awaited<ReturnType<typeof fetchProfile>>;
  let identity: Awaited<ReturnType<typeof supabase.auth.getUser>>;
  try {
    [remote, identity] = await Promise.all([fetchProfile(userId), supabase.auth.getUser()]);
  } catch {
    return local;
  }
  if (identity.error) return local;
  if (identity.data.user?.id !== userId) throw new Error('Oturum değişti. Yeniden giriş yap.');
  const storedHour = identity.data.user.user_metadata?.reminder_hour;
  const resolved = sanitizePrefs({
    enabled: remote.notificationsEnabled ?? local.enabled,
    defaultDays: remote.defaultNotifyDays ?? local.defaultDays,
    reminderHour: Number.isInteger(storedHour) && storedHour >= 0 && storedHour <= 23 ? storedHour : local.reminderHour,
  });
  void writeJson(keyFor(userId), resolved).catch(() => undefined);
  return resolved;
}

export async function savePrefs(userId: string, prefs: NotifyPrefs): Promise<void> {
  const clean = sanitizePrefs(prefs);
  await assertActiveUser(userId);
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    push_enabled: clean.enabled,
    default_notify_days: clean.defaultDays,
  }, { onConflict: 'user_id' });
  if (error) throw new Error('Bildirim tercihleri kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  // The profile write can take long enough for the user to switch accounts. Do not
  // let the following Auth metadata write land on whichever session is current.
  await assertActiveUser(userId);
  const identity = await supabase.auth.updateUser({ data: { reminder_hour: clean.reminderHour } });
  if (identity.error) throw new Error('Bildirim saati kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
  await writeJson(keyFor(userId), clean);
}

async function assertActiveUser(userId: string): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error('Oturum doğrulanamadı. Yeniden giriş yap.');
  if (data.user?.id !== userId) throw new Error('Oturum değişti. Yeniden giriş yap.');
}

export function useNotifyPrefs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: notifyPrefsKey(user?.id),
    queryFn: () => loadPrefs(user?.id ?? ''),
    enabled: Boolean(user),
  });
}

/** Tercihi kaydeder ve sorguyu günceller. */
export function useSetNotifyPrefs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async (next: NotifyPrefs) => {
    if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
    try {
      await savePrefs(user.id, next);
      queryClient.setQueryData(notifyPrefsKey(user.id), sanitizePrefs(next));
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: notifyPrefsKey(user.id) });
      throw error;
    }
  };
}
