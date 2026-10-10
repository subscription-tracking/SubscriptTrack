import { groupPaymentsByMonth } from './paymentGroups';
import { type PaymentEvent } from './paymentEvents';
import { Money } from '../../../core/domain/money';

const payment = (id: string, paidAt: string): PaymentEvent =>
  ({ id, subscriptionId: 's', amount: Money.fromMinorUnits(100), currency: 'TRY', paidAt }) as unknown as PaymentEvent;

describe('groupPaymentsByMonth', () => {
  it('en yeni ödemeyi üstte sıralar', () => {
    const items = groupPaymentsByMonth([payment('a', '2026-09-05T12:00:00'), payment('b', '2026-10-02T12:00:00')]);
    const rows = items.filter((item) => item.kind === 'row').map((item) => item.key);
    expect(rows).toEqual(['b', 'a']);
  });

  it('her ay için bir başlık ekler', () => {
    const items = groupPaymentsByMonth([
      payment('a', '2026-10-02T12:00:00'),
      payment('b', '2026-10-09T12:00:00'),
      payment('c', '2026-09-05T12:00:00'),
    ]);
    const headers = items.filter((item) => item.kind === 'header').map((item) => (item.kind === 'header' ? item.label : ''));
    expect(headers).toEqual(['Ekim 2026', 'Eylül 2026']);
  });

  it('boş listede öğe yok', () => {
    expect(groupPaymentsByMonth([])).toEqual([]);
  });
});
