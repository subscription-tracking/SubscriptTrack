import { civilDate } from '../../../core/time/calendar';
import { subscriptionFromRow, type SubscriptionRow } from './subscription';
import { splitAttention } from './subscriptionList';

const sub = (id: string, next: string, status: SubscriptionRow['status'] = 'active') =>
  subscriptionFromRow({
    id,
    name: id,
    amount: '10',
    currency: 'TRY',
    billing_cycle: 'monthly',
    category: 'other',
    status,
    start_date: null,
    next_renewal_date: next,
    payment_method: null,
    notes: null,
    website: null,
    trial_end_date: null,
    trial_price_after: null,
  });

describe('splitAttention', () => {
  const today = civilDate(2026, 10, 9);

  it('gecikmiş ve bugün vadeli kayıtları ayırır, sırayı korur', () => {
    const rows = [sub('gec', '2026-10-06'), sub('bugun', '2026-10-09'), sub('yakin', '2026-10-10'), sub('uzak', '2026-11-01')];
    const { attention, rest } = splitAttention(rows, today);
    expect(attention.map((item) => item.id)).toEqual(['gec', 'bugun']);
    expect(rest.map((item) => item.id)).toEqual(['yakin', 'uzak']);
  });

  it('duraklatılmış kaydı dikkat grubuna almaz', () => {
    const { attention } = splitAttention([sub('dur', '2026-10-01', 'paused')], today);
    expect(attention).toEqual([]);
  });
});
