import { groupPaymentsByMonth } from './paymentGroups';
import { type PaymentEvent } from './paymentEvents';
import { Money } from '../../../core/domain/money';

const payment = (id: string, paidAt: string): PaymentEvent =>
  ({ id, subscriptionId: 's', amount: Money.fromMinorUnits(100), currency: 'TRY', paidAt }) as unknown as PaymentEvent;

describe('groupPaymentsByMonth', () => {
  it('en yeni ödemeyi üstte sıralar', () => {
    const items = groupPaymentsByMonth([payment('a', '2026-09-05T09:00:00Z'), payment('b', '2026-10-02T09:00:00Z')], 'Europe/Istanbul');
    const rows = items.filter((item) => item.kind === 'row').map((item) => item.key);
    expect(rows).toEqual(['b', 'a']);
  });

  it('her ay için bir başlık ekler', () => {
    const items = groupPaymentsByMonth([
      payment('a', '2026-10-02T09:00:00Z'),
      payment('b', '2026-10-09T09:00:00Z'),
      payment('c', '2026-09-05T09:00:00Z'),
    ], 'Europe/Istanbul');
    const headers = items.filter((item) => item.kind === 'header').map((item) => (item.kind === 'header' ? item.label : ''));
    expect(headers).toEqual(['Ekim 2026', 'Eylül 2026']);
  });

  it('boş listede öğe yok', () => {
    expect(groupPaymentsByMonth([], 'Europe/Istanbul')).toEqual([]);
  });
});
