/**
 * Grafiklerin ekran okuyucu özeti. Tutar metinleri çağıran tarafta biçimlenir (para birimi bu dosyaya girmez).
 * I/O yoktur.
 */

/** "Son 6 ay, toplam 2.340 ₺, en yüksek Ekim" biçiminde tek cümle. */
export function trendSummary(input: { periodLabel: string; totalText: string; peakMonth: string | null }): string {
  const peak = input.peakMonth ? `, en yüksek ${input.peakMonth}` : '';
  return `${input.periodLabel}, toplam ${input.totalText}${peak}`;
}

/** "3 kategori, toplam 1.200 ₺, en büyük Eğlence %60" biçiminde tek cümle. */
export function categorySummary(input: { count: number; totalText: string; topName: string | null; topPercent: number }): string {
  if (input.count === 0) return 'Kategori yok';
  const top = input.topName ? `, en büyük ${input.topName} %${input.topPercent}` : '';
  return `${input.count} kategori, toplam ${input.totalText}${top}`;
}
