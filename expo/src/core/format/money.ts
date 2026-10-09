import type { Money } from '../domain/money';

/**
 * Para birimi gösterimi, Flutter `DateTimeUtils.formatCurrency` ile birebir: sembol önde (₺, $, €, £;
 * diğer kodlar olduğu gibi), binlik ayırıcı nokta, ondalık ayırıcı virgül, her zaman 2 ondalık.
 * Hesaplama `Money` ile yapılır; bu fonksiyon yalnızca ekrana yazar. I/O yoktur.
 */

const SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/** Ham tutar (ana birim) için gösterim. Canlandırma (sayma) animasyonu bu fonksiyonu kullanır. */
export function formatAmount(amount: number, currency: string): string {
  const symbol = SYMBOLS[currency] ?? currency;
  const [integer, decimals] = amount.toFixed(2).split('.');
  const grouped = integer.replace(/(?<=\d)(?=(\d{3})+(?!\d))/g, '.');
  return `${symbol}${grouped},${decimals}`;
}

export function formatCurrency(money: Money, currency: string): string {
  return formatAmount(money.amount, currency);
}
