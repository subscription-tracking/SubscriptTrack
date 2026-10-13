import { Money } from '../../../../core/domain/money';
import { type PaymentEvent } from '../../../stats/domain/paymentEvents';
import { periodSuffix, reminderSummary, totalPaid } from './detailFormat';

function payment(id: string, amount: string, status: PaymentEvent['status'], currency = 'TRY'): PaymentEvent {
  return { id, subscriptionId: 's', amount: Money.parse(amount), currency, paidAt: '2026-10-01T09:00:00Z', status };
}

describe('detailFormat', () => {
  it('periyot ekini döngüye göre verir', () => {
    expect(periodSuffix('monthly')).toBe('/ ay');
    expect(periodSuffix('yearly')).toBe('/ yıl');
    expect(periodSuffix('weekly')).toBe('/ hafta');
    expect(periodSuffix('quarterly')).toBe('/ 3 ay');
  });

  it('hatırlatma özetini etkin kurallardan çıkarır', () => {
    expect(reminderSummary([])).toBe('Kapalı');
    expect(reminderSummary([{ daysBefore: 3, enabled: false }])).toBe('Kapalı');
    expect(reminderSummary([{ daysBefore: 3, enabled: true }])).toBe('3 gün önce');
    expect(reminderSummary([{ daysBefore: 3, enabled: true }, { daysBefore: 1, enabled: true }])).toBe('1 ve 3 gün önce');
    expect(reminderSummary([{ daysBefore: 0, enabled: true }])).toBe('Yenileme günü');
  });

  it('yalnızca ödenmiş ve aynı para birimindeki kayıtları toplar', () => {
    const list = [payment('1', '10.50', 'PAID'), payment('2', '20.00', 'PAID'), payment('3', '99', 'DEFERRED'), payment('4', '5', 'PAID', 'USD')];
    expect(totalPaid(list, 'TRY')?.amount).toBe(30.5);
    expect(totalPaid([], 'TRY')).toBeNull();
    expect(totalPaid([payment('3', '99', 'DEFERRED')], 'TRY')).toBeNull();
  });
});
