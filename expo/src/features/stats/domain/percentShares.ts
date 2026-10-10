/**
 * Yüzdeleri en büyük kalan yöntemiyle yuvarlar: her pay önce aşağı yuvarlanır, kalan puanlar en büyük kesirli
 * kısma verilir. Sonuç toplamı tam 100 eder (satır satır yuvarlamada %100 tutmayabiliyordu). Toplam sıfırsa
 * hepsi 0. I/O yoktur.
 */
export function percentShares(values: readonly number[], total: number): number[] {
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((value) => (value / total) * 100);
  const floors = raw.map((value) => Math.floor(value));
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    floors[index] += 1;
    remaining -= 1;
  }
  return floors;
}
