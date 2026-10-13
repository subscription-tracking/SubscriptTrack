import type { CivilDate } from '../time/calendar';
import { dayNumber, zoneToday } from '../time/calendar';

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** "30 Eylül 2026" biçimi (Flutter `DateTimeUtils.formatLongDate`). */
export function formatLongDate(date: CivilDate): string {
  return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`;
}

/** Bir zaman damgasını cihazın değil, kullanıcının IANA saat dilimindeki gün olarak gösterir. */
export function formatTimestampDate(instant: string | Date, timeZone: string): string {
  return formatLongDate(zoneToday(timeZone, typeof instant === 'string' ? new Date(instant) : instant));
}

/**
 * Flutter `DateTimeUtils.formatDate`: bugün "Bugün", yarın "Yarın", geçmiş "Geçmiş", diğerleri
 * "30 Eylül 2026". Gün farkı takvim günü üzerinden hesaplanır.
 */
export function formatRelativeDate(date: CivilDate, today: CivilDate): string {
  const diff = dayNumber(date) - dayNumber(today);
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff < 0) return 'Geçmiş';
  return formatLongDate(date);
}

/** "Ekim 2026" biçimi (takvim başlığı). */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

/** Pazartesi başlangıçlı kısa gün adları (takvim üst satırı). */
export const WEEKDAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

/** Kısa ay adı, üç harf ("Eki", "Kas"). Trend grafiği etiketi için. */
export function monthShort(month: number): string {
  return MONTHS[month - 1].slice(0, 3);
}
