import { Money } from './money';

/**
 * Para birimi başına toplam. Kur çevrimi yoktur: farklı para birimleri hiçbir koşulda birleştirilmez. Toplamak
 * için tutarla birlikte para birimi verilir; böylece farklı birimlerdeki `Money` değerlerini karıştırmak
 * mümkün olmaz. Sıralama tek yerdedir: tercih edilen para birimi başta, sonra TRY, USD, EUR, sonra alfabetik.
 * I/O yoktur.
 */

const KNOWN_ORDER = ['TRY', 'USD', 'EUR'] as const;

/** Para birimi kodlarını ürün sırasına dizer; tekrarları atar. `preferred` verilirse (listede olmasa bile) ilk gelir. */
export function orderCurrencies(codes: Iterable<string>, preferred?: string): string[] {
  const unique = new Set(codes);
  if (preferred) unique.add(preferred);
  const rank = (code: string) => {
    if (code === preferred) return -1;
    const index = (KNOWN_ORDER as readonly string[]).indexOf(code);
    return index === -1 ? KNOWN_ORDER.length : index;
  };
  return [...unique].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export class MoneyByCurrency {
  private readonly totals = new Map<string, Money>();

  /** `amount` değerini `currency` toplamına ekler; kendisini döndürür. */
  add(currency: string, amount: Money): this {
    this.totals.set(currency, (this.totals.get(currency) ?? Money.zero).add(amount));
    return this;
  }

  /** Para biriminde hiç kayıt yoksa sıfır döner. */
  get(currency: string): Money {
    return this.totals.get(currency) ?? Money.zero;
  }

  has(currency: string): boolean {
    return this.totals.has(currency);
  }

  get isEmpty(): boolean {
    return this.totals.size === 0;
  }

  /** Sıralı (para birimi, toplam) çiftleri. `includeZero` kapalıysa sıfır toplamlar atlanır. */
  entries(preferred?: string, includeZero = true): { currency: string; total: Money }[] {
    return orderCurrencies(this.totals.keys(), this.totals.has(preferred ?? '') ? preferred : undefined)
      .map((currency) => ({ currency, total: this.get(currency) }))
      .filter((entry) => includeZero || entry.total.minorUnits !== 0);
  }

  /** Verilen kayıtların aylık/yıllık gibi bir tutarını para birimine göre toplar. */
  static from<T extends { currency: string }>(items: readonly T[], amountOf: (item: T) => Money | null | undefined): MoneyByCurrency {
    const result = new MoneyByCurrency();
    for (const item of items) {
      const amount = amountOf(item);
      if (amount) result.add(item.currency, amount);
    }
    return result;
  }
}
