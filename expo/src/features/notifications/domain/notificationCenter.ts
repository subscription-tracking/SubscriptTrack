/**
 * Uygulama içi bildirim merkezi kuralları (Flutter `NotificationRepository._title/_body` ile
 * birebir aynı metinler). Sunucu `notifications` satırlarını bu türlerle yazar. I/O yoktur.
 */

export const NOTIFICATION_KINDS = [
  'renewal_today',
  'renewal_soon',
  'renewal_upcoming',
  'trial_today',
  'trial_soon',
  'trial_upcoming',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Merkezde gösterilen geçmiş penceresi (gün). Flutter ile aynı: 14 gün. */
export const CENTER_WINDOW_DAYS = 14;
export const CENTER_LIMIT = 50;

export function parseKind(raw: string): NotificationKind | null {
  return (NOTIFICATION_KINDS as readonly string[]).includes(raw) ? (raw as NotificationKind) : null;
}

export interface NotificationParams {
  name?: string;
  days?: number;
}

export function notificationText(kind: NotificationKind, params: NotificationParams): { title: string; body: string } {
  const name = params.name ?? '';
  const days = params.days ?? 0;
  switch (kind) {
    case 'renewal_today':
      return { title: 'Bugün yenileniyor', body: `${name} bugün yenileniyor.` };
    case 'renewal_soon':
      return { title: `${days} gün kaldı`, body: `${name} ${days} gün içinde yenileniyor.` };
    case 'renewal_upcoming':
      return { title: 'Yaklaşan yenileme', body: `${name} ${days} gün içinde yenileniyor.` };
    case 'trial_today':
      return { title: 'Ücretsiz deneme bugün sona eriyor', body: `${name} ücretsiz denemesi bugün sona eriyor.` };
    case 'trial_soon':
      return { title: `Denemenin bitmesine ${days} gün kaldı`, body: `${name} ücretsiz denemesi ${days} gün içinde sona eriyor.` };
    case 'trial_upcoming':
      return { title: 'Yaklaşan deneme bitişi', body: `${name} ücretsiz denemesi ${days} gün içinde sona eriyor.` };
  }
}

/** Okunmamış sayısı: `read_at` boş olanlar. */
export function unreadCount(rows: readonly { readAt: string | null }[]): number {
  return rows.filter((row) => row.readAt === null).length;
}
