import { Money } from '../../../../core/domain/money';
import { type PaymentEvent } from '../../../stats/domain/paymentEvents';
import { type Subscription } from '../../domain/subscription';

/** Tutarın yanındaki periyot eki: "/ ay", "/ yıl" gibi. */
export function periodSuffix(cycle: Subscription['billingCycle']): string {
  switch (cycle) {
    case 'weekly':
      return '/ hafta';
    case 'quarterly':
      return '/ 3 ay';
    case 'yearly':
      return '/ yıl';
    default:
      return '/ ay';
  }
}

/** Etkin kuralların artan gün listesi. Hatalı biçimli kayıtlar atlanır. */
export function enabledRuleDays(rules: unknown[]): number[] {
  const values = rules.flatMap((rule) => {
    if (typeof rule !== 'object' || rule === null) return [];
    const { daysBefore, enabled } = rule as { daysBefore?: unknown; enabled?: unknown };
    return enabled === true && typeof daysBefore === 'number' ? [daysBefore] : [];
  });
  return [...new Set(values)].sort((a, b) => a - b);
}

/** Hatırlatma özeti: "3 gün önce", "1 ve 3 gün önce", "Yenileme günü" ya da "Kapalı". */
export function reminderSummary(rules: unknown[]): string {
  const days = enabledRuleDays(rules);
  if (days.length === 0) return 'Kapalı';
  if (days.every((value) => value !== 0)) {
    const joined = days.length === 1 ? String(days[0]) : `${days.slice(0, -1).join(', ')} ve ${days[days.length - 1]}`;
    return `${joined} gün önce`;
  }
  return capitalize(days.map((value) => (value === 0 ? 'yenileme günü' : `${value} gün önce`)).join(', '));
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('tr-TR') + text.slice(1);
}

/** Bu aboneliğin ödenmiş (`PAID`) kayıtlarının, abonelik para birimindeki toplamı; yoksa null. */
export function totalPaid(payments: readonly PaymentEvent[], currency: string): Money | null {
  const paid = payments.filter((event) => event.status === 'PAID' && event.currency === currency);
  if (paid.length === 0) return null;
  return paid.reduce((sum, event) => sum.add(event.amount), Money.fromMinorUnits(0));
}
