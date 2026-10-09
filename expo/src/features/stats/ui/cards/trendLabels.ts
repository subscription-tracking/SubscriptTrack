/** Flutter `trendMonthLabel`: üç harfli ay adları (Oca, Şub, ...). */
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;

export function trendMonthLabel(date: Date): string {
  return MONTHS[date.getMonth()];
}
