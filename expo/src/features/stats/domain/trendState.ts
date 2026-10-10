/**
 * Trend grafiğinin durumu. `empty`: hiç ödeme yok; `single`: yalnızca bir ayda ödeme var, karşılaştırma yapılamaz;
 * `ready`: en az iki ayda ödeme var. I/O yoktur.
 */
export type TrendState = 'empty' | 'single' | 'ready';

export function trendState(values: readonly number[]): TrendState {
  const withPayments = values.filter((value) => value > 0).length;
  if (withPayments === 0) return 'empty';
  if (withPayments < 2) return 'single';
  return 'ready';
}
