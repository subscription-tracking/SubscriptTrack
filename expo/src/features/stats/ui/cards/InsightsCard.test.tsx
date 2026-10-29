import { fireEvent, render, screen } from '@testing-library/react-native';
import { Money } from '../../../../core/domain/money';
import { subscriptionFromRow, type SubscriptionRow } from '../../../subscriptions/domain/subscription';
import { InsightsCard } from './InsightsCard';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/FontAwesome6', () => 'FontAwesome6');

const base: SubscriptionRow = {
  id: '1', name: 'Servis', amount: '10', currency: 'TRY', billing_cycle: 'monthly', category: 'music', status: 'active',
  start_date: '2026-01-01', next_renewal_date: '2026-10-15', payment_method: null, notes: null, website: null,
  trial_end_date: null, trial_price_after: null,
};

it('üç ismi gösterirken toplam kayıt sayısını ve ortak servis kimliğini korur', () => {
  const dueSoon = Array.from({ length: 5 }, (_, i) => subscriptionFromRow({ ...base, id: String(i), name: `Servis ${i}` }));
  const review = jest.fn();
  render(<InsightsCard highest={dueSoon[0]} total={Money.parse('50')} currency="TRY" dueSoon={dueSoon} onReviewDue={review} />);
  expect(screen.getByText(/5 abonelik yarından itibaren 7 gün/)).toBeTruthy();
  expect(screen.getByText('Servis 0, Servis 1, Servis 2')).toBeTruthy();
  expect(screen.getByLabelText('Servis 0 logosu')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'İncele' }));
  expect(review).toHaveBeenCalledTimes(1);
});
