import type { CivilDate } from '../../../core/time/calendar';

export function formatDateParam(day: CivilDate): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${day.year}-${pad(day.month)}-${pad(day.day)}`;
}

