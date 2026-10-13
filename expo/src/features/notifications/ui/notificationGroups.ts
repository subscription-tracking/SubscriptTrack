import { dayNumber, zoneToday } from '../../../core/time/calendar';

export type NotificationGroupTitle = 'Bugün' | 'Dün' | 'Bu hafta' | 'Daha eski';

/** Bildirimin oluşturulma gününe göre bölüm başlığı (kullanıcının saat diliminde takvim günü farkı). */
export function groupTitleFor(createdAt: string, now: Date, timeZone: string): NotificationGroupTitle {
  const diff = dayNumber(zoneToday(timeZone, now)) - dayNumber(zoneToday(timeZone, new Date(createdAt)));
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  if (diff < 7) return 'Bu hafta';
  return 'Daha eski';
}

const ORDER: readonly NotificationGroupTitle[] = ['Bugün', 'Dün', 'Bu hafta', 'Daha eski'];

/** Öğeleri gün gruplarına ayırır; boş gruplar atlanır, grup içi sıra korunur. */
export function groupByDay<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date,
  timeZone: string,
): { title: NotificationGroupTitle; data: T[] }[] {
  const buckets = new Map<NotificationGroupTitle, T[]>();
  for (const item of items) {
    const title = groupTitleFor(item.createdAt, now, timeZone);
    buckets.set(title, [...(buckets.get(title) ?? []), item]);
  }
  return ORDER.filter((title) => buckets.has(title)).map((title) => ({ title, data: buckets.get(title) ?? [] }));
}
