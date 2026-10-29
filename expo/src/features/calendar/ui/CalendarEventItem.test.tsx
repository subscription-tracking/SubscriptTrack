import { render, screen } from '@testing-library/react-native';

import { civilDate } from '../../../core/time/calendar';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { CalendarEventItem } from './CalendarEventItem';

const subscription = subscriptionFromRow({
  id: 'sub-1',
  name: 'Video Plus',
  amount: '129.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-05',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);

describe('CalendarEventItem accessibility', () => {
  it('date, event kind, subscription and amount are in the screen reader label', () => {
    render(<CalendarEventItem subscription={subscription} date={civilDate(2026, 10, 5)} isTrial onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: '5 Ekim 2026, Video Plus, deneme bitişi, deneme sonrası ücret bilinmiyor' })).toBeTruthy();
    expect(screen.getByText('Ücret bilinmiyor')).toBeTruthy();
  });

  it('deneme sonrası ücret varsa sıfır deneme fiyatı yerine bu ücreti açıkça gösterir', () => {
    const trial = subscriptionFromRow({ id: 'trial', name: 'Deneme', amount: '0', currency: 'TRY', billing_cycle: 'monthly', category: 'streaming', status: 'trial', start_date: '2026-10-01', next_renewal_date: '2026-10-05', payment_method: null, notes: null, website: null, trial_end_date: '2026-10-05', trial_price_after: '79.90' });
    render(<CalendarEventItem subscription={trial} date={civilDate(2026, 10, 5)} isTrial onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: /deneme sonrası ₺79,90/ })).toBeTruthy();
    expect(screen.getByText('Deneme sonrası')).toBeTruthy();
  });
});
