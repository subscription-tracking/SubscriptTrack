import type { Money } from '../domain/money';

/**
 * Para birimi gösterimi (tr-TR). Hesaplama `Money` ile yapılır; bu fonksiyon yalnızca
 * ekrana yazar. Intl başarısız olursa kod ve ondalık metin olarak gösterir.
 */
export function formatCurrency(money: Money, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(money.amount);
  } catch {
    return `${money.decimalString} ${currency}`;
  }
}
