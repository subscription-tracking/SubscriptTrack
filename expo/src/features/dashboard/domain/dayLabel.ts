import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;

/** Günün Türkçe adı ("Perşembe"). */
export function weekdayName(date: CivilDate): string {
  return WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
}

/** Zaman çizelgesi grup başlığı: bugüne göre 1 gün "Yarın", diğerleri "15 Ekim · Perşembe". */
export function upcomingDayLabel(date: CivilDate, dayOffset: number): string {
  if (dayOffset === 1) return 'Yarın';
  return `${formatLongDate(date).replace(` ${date.year}`, '')} · ${weekdayName(date)}`;
}
