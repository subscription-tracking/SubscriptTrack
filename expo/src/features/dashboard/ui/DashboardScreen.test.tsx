import { fireEvent, render, screen } from '@testing-library/react-native';

import { DashboardScreen } from './DashboardScreen';
import { subscriptionFromRow, type SubscriptionRow } from '../../subscriptions/domain/subscription';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockSubscriptions = [subscriptionFromRow({
  id: 'active-1',
  name: 'Video Plus',
  amount: '49.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-10-01',
  next_renewal_date: '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow)];

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user', displayName: 'Test', email: 'test@example.com' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../../savings/data/queries', () => ({ useSavingsQuery: () => ({ data: [], isPending: false, isError: false }) }));
jest.mock('../../stats/data/queries', () => ({ usePaymentsQuery: () => ({ data: [], isPending: false, isError: false }) }));

beforeEach(() => {
  mockPush.mockReset();
  mockNavigate.mockReset();
  mockRefetch.mockReset();
  mockUseSubscriptionsQuery.mockReset();
  mockUseSubscriptionsQuery.mockReturnValue({ data: mockSubscriptions, isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });
});

it('"Takvimde gör" ve hızlı işlem takvim eylemi takvim rotasını açar', () => {
  render(<DashboardScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'Takvimde gör' }));
  expect(mockPush).toHaveBeenLastCalledWith('/calendar');

  fireEvent.press(screen.getByRole('button', { name: 'Takvimi aç' }));
  expect(mockPush).toHaveBeenLastCalledWith('/calendar');
  expect(mockNavigate).not.toHaveBeenCalledWith('/subscriptions');
});

it('hatırlatma kısayolu kartlarda tekrarlanmadan tek satırda görünür', () => {
  render(<DashboardScreen />);

  expect(screen.getAllByRole('button', { name: 'Hatırlatma ayarları' })).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: 'Hatırlatma ayarları' }));
  expect(mockPush).toHaveBeenLastCalledWith('/settings/notifications');
});

it('özet yüklenirken ilerleme durumunu gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, isRefetching: false, refetch: mockRefetch });

  render(<DashboardScreen />);

  expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
});

it('yükleme hatasında tekrar dene eylemini çalıştırır', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, isRefetching: false, refetch: mockRefetch });

  render(<DashboardScreen />);

  expect(screen.getByText('Özet yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
});

it('hiç abonelik yokken başlangıç açıklamasını ve ekleme eylemini gösterir', () => {
  mockUseSubscriptionsQuery.mockReturnValue({ data: [], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });

  render(<DashboardScreen />);

  expect(screen.getByText('Ana sayfanı oluşturmaya başla')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'İlk aboneliğini ekle' }));
  expect(mockPush).toHaveBeenCalledWith('/subscriptions/add');
});
