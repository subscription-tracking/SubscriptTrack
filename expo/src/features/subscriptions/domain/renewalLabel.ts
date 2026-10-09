/**
 * Yenilemeye kalan süreyi insan okunur metne çevirir (Flutter `DateTimeUtils.renewalLabel`).
 * Sınırlar Flutter testleriyle aynıdır: 7 güne kadar gün, 30 güne kadar hafta, sonrası ay.
 */
export function renewalLabel(days: number): string {
  if (days < 0) return 'Süresi doldu';
  if (days === 0) return 'Bugün yenileniyor';
  if (days === 1) return 'Yarın yenileniyor';
  if (days <= 7) return `${days} gün sonra`;
  if (days <= 30) return `${Math.round(days / 7)} hafta sonra`;
  return `${Math.round(days / 30)} ay sonra`;
}
