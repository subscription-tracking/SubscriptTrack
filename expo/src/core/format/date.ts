import type { CivilDate } from '../time/calendar';

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
