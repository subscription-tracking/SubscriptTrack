/**
 * Desteklenen para birimleri ve kullanıcının tercih ettiği para birimi. Tercih bir filtre değildir: form varsayılanı,
 * ilk sıra ve İstatistikler'de başlangıç seçimidir; kayıtları gizlemez. Kur çevrimi yapılmaz.
 * I/O yoktur.
 */

export const ACTIVE_CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export type ActiveCurrency = (typeof ACTIVE_CURRENCIES)[number];
export const DEFAULT_ACTIVE_CURRENCY: ActiveCurrency = 'TRY';

export const CURRENCY_SYMBOLS: Record<ActiveCurrency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<ActiveCurrency, string> = {
  TRY: 'Türk Lirası',
  USD: 'ABD Doları',
  EUR: 'Euro',
};

export function isActiveCurrency(value: string | null | undefined): value is ActiveCurrency {
  return value !== null && value !== undefined && (ACTIVE_CURRENCIES as readonly string[]).includes(value);
}

/**
 * Etkin para birimi: önce profildeki kayıtlı tercih, yoksa bu cihazda son seçilen, o da yoksa TRY.
 * Desteklenmeyen (ör. eski GBP) değerler yok sayılır.
 */
export function resolveActiveCurrency(profile: string | null | undefined, device: string | null | undefined): ActiveCurrency {
  if (isActiveCurrency(profile)) return profile;
  if (isActiveCurrency(device)) return device;
  return DEFAULT_ACTIVE_CURRENCY;
}
