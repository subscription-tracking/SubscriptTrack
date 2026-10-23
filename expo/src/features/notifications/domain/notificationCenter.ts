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

/**
 * Bildirim metni: başlık abonelik adı, gövde kalan süre. Ad yoksa tür adı başlık olur (tekrar yok).
 */
export function notificationText(kind: NotificationKind, params: NotificationParams): { title: string; body: string } {
  const name = params.name?.trim() ?? '';
  const days = params.days ?? 0;
  const fallback = kind.startsWith('trial') ? 'Ücretsiz deneme' : 'Abonelik';
  const title = name.length > 0 ? name : fallback;
  switch (kind) {
    case 'renewal_today':
      return { title, body: 'Bugün yenileniyor' };
    case 'renewal_soon':
      return { title, body: `Yenilenmesine ${days} gün kaldı` };
    case 'renewal_upcoming':
      return { title, body: `${days} gün içinde yenilenecek` };
    case 'trial_today':
      return { title, body: 'Deneme bugün sona eriyor' };
    case 'trial_soon':
      return { title, body: `Denemenin bitmesine ${days} gün kaldı` };
    case 'trial_upcoming':
      return { title, body: `Deneme ${days} gün içinde sona erecek` };
  }
}

/** Okunmamış sayısı: `read_at` boş olanlar. */
const EMPTY_IDS: ReadonlySet<string> = new Set();

/** Okunmamış sayısı: sunucu okunması ve bu cihazın yerel okunma/kapatma durumu birlikte değerlendirilir. */
export function unreadCount(
  rows: readonly { id: string; readAt: string | null }[],
  localRead: ReadonlySet<string> = EMPTY_IDS,
  dismissed: ReadonlySet<string> = EMPTY_IDS,
): number {
  return rows.filter((row) => row.readAt === null && !localRead.has(row.id) && !dismissed.has(row.id)).length;
}
