import { type Money } from '../../../core/domain/money';
import { MoneyByCurrency } from '../../../core/domain/moneyByCurrency';
import { type Subscription, monthlyEquivalent } from './subscription';

/** Aktif kayıtların aylık eşdeğer toplamı, para birimi başına ve ürün sırasıyla; kur çevrimi yoktur. */
export function activeMonthlyTotals(subscriptions: readonly Subscription[]): { currency: string; total: Money }[] {
  return MoneyByCurrency.from(subscriptions.filter((item) => item.status === 'active'), monthlyEquivalent).entries();
}

/** Gruplanmış listede satırın yeri: bölüm başlığı ya da liste ucu grubu kapatır. */
export function rowPosition(rows: readonly { kind: string }[], index: number): 'single' | 'first' | 'middle' | 'last' {
  const first = rows[index - 1]?.kind !== 'item';
  const last = rows[index + 1]?.kind !== 'item';
  return first && last ? 'single' : first ? 'first' : last ? 'last' : 'middle';
}
