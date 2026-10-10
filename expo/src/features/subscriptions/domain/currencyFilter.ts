/**
 * Aktif para birimine göre süzme. Başka para birimindeki kayıtlar toplam, liste ve grafiklerde gösterilmez;
 * kaç kaydın gizlendiği ayrıca bildirilir. I/O yoktur.
 */

interface HasCurrency {
  currency: string;
}

export function inCurrency<T extends HasCurrency>(items: readonly T[], currency: string): T[] {
  return items.filter((item) => item.currency === currency);
}

export function hiddenCount<T extends HasCurrency>(items: readonly T[], currency: string): number {
  return items.length - inCurrency(items, currency).length;
}
