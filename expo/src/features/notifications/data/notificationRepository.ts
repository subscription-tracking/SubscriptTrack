import { supabase } from '../../../core/supabase/client';
import { CENTER_LIMIT, CENTER_WINDOW_DAYS, type NotificationKind, parseKind } from '../domain/notificationCenter';

/** Bildirim merkezi satırı. `readAt` sunucudaki `read_at` alanıdır. */
export interface CenterNotification {
  id: string;
  kind: NotificationKind;
  subscriptionId: string | null;
  name: string;
  days: number;
  createdAt: string;
  readAt: string | null;
}

interface NotificationRow {
  id: string;
  subscription_id: string | null;
  type: string;
  body_params: { name?: unknown; days?: unknown } | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Okundu işaretini sunucuya en iyi çabayla yazar (Flutter `NotificationReadSyncService`). Asıl durum cihazdadır;
 * hata sessizce yutulur ve yalnızca okunmamış satırlar güncellenir.
 */
export async function markNotificationsRead(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', [...ids]).is('read_at', null);
  } catch {
    // Yerel durum kaynak olarak kalır; bir sonraki yüklemede sunucu geri bildirimi yeniden denenebilir.
  }
}

/** Son 14 günün bildirimleri (en yeni önce). */
export async function fetchNotifications(): Promise<CenterNotification[]> {
  const cutoff = new Date(Date.now() - CENTER_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, subscription_id, type, body_params, read_at, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(CENTER_LIMIT);
  if (error) throw new Error('Bildirimler yüklenemedi. Bağlantını kontrol edip tekrar dene.');
  return (data as NotificationRow[]).flatMap((row) => {
    const kind = parseKind(row.type);
    if (!kind) return [];
    const params = row.body_params ?? {};
    return [
      {
        id: row.id,
        kind,
        subscriptionId: row.subscription_id,
        name: typeof params.name === 'string' ? params.name : '',
        days: typeof params.days === 'number' ? params.days : 0,
        createdAt: row.created_at,
        readAt: row.read_at,
      },
    ];
  });
}
