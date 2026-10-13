import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { civilDate } from '../../../core/time/calendar';
import { subscriptionFromRow, type SubscriptionRow } from '../../subscriptions/domain/subscription';
import { attentionItems } from '../domain/homeSummary';
import { AttentionSection, attentionSubtitle } from './AttentionSection';

const mockRenew = jest.fn();
let mockPending: { isPending: boolean; variables?: { id: string } } = { isPending: false };

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../subscriptions/ui/useRenewAction', () => ({
  useRenewAction: () => ({ mutate: mockRenew, ...mockPending }),
}));

const today = civilDate(2026, 10, 13);
const row = (id: string, next: string): SubscriptionRow => ({
  id,
  name: `Servis ${id}`,
  amount: '40',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: next,
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
});
const itemsFor = (rows: SubscriptionRow[]) => attentionItems(rows.map(subscriptionFromRow), today);

beforeEach(() => {
  mockRenew.mockReset();
  mockPending = { isPending: false };
});

it('gecikmiş ve bugünkü satırların alt metnini yazar', () => {
  const [overdue, due] = itemsFor([row('a', '2026-10-10'), row('b', '2026-10-13')]);
  expect(attentionSubtitle(overdue)).toContain('3 gün gecikti');
  expect(attentionSubtitle(due)).toContain('Bugün yenileniyor');
});

it('en fazla üç satır gösterir ve fazlası için "+N daha" bağlantısını açar', () => {
  const onMore = jest.fn();
  const items = itemsFor([row('a', '2026-10-01'), row('b', '2026-10-02'), row('c', '2026-10-03'), row('d', '2026-10-04'), row('e', '2026-10-05')]);
  render(<AttentionSection items={items} today={today} onOpen={jest.fn()} onMore={onMore} />);

  expect(screen.getAllByRole('button', { name: 'Ödendi' })).toHaveLength(3);
  fireEvent.press(screen.getByText('+2 daha'));
  expect(onMore).toHaveBeenCalledTimes(1);
});

it('satıra dokununca detayı açar', () => {
  const onOpen = jest.fn();
  render(<AttentionSection items={itemsFor([row('a', '2026-10-10')])} today={today} onOpen={onOpen} onMore={jest.fn()} />);

  fireEvent.press(screen.getByRole('button', { name: /Servis a/ }));
  expect(onOpen).toHaveBeenCalledWith('a');
});

it('Vazgeç yenilemeyi çalıştırmaz', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<AttentionSection items={itemsFor([row('a', '2026-10-10')])} today={today} onOpen={jest.fn()} onMore={jest.fn()} />);

  fireEvent.press(screen.getByRole('button', { name: 'Ödendi' }));
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  buttons.find((button) => button.text === 'Vazgeç')?.onPress?.();
  expect(mockRenew).not.toHaveBeenCalled();
  alertSpy.mockRestore();
});

it('işlem sürerken yalnız o satırın düğmesi pasif olur', () => {
  mockPending = { isPending: true, variables: { id: 'a' } };
  render(<AttentionSection items={itemsFor([row('a', '2026-10-10'), row('b', '2026-10-11')])} today={today} onOpen={jest.fn()} onMore={jest.fn()} />);

  const [first, second] = screen.getAllByRole('button', { name: 'Ödendi' });
  expect(first.props.accessibilityState.disabled).toBe(true);
  expect(second.props.accessibilityState.disabled).toBe(false);
});

it('kayıt yoksa hiçbir şey çizmez', () => {
  render(<AttentionSection items={[]} today={today} onOpen={jest.fn()} onMore={jest.fn()} />);

  expect(screen.queryByText('Geciken ödemeler')).toBeNull();
});
