import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DashboardScreen } from './DashboardScreen';
import { Money } from '../../../core/domain/money';
import { subscriptionFromRow, type SubscriptionRow } from '../../subscriptions/domain/subscription';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockRenew = jest.fn();
const mockPayments = jest.fn();
const row = (overrides: Partial<SubscriptionRow>): SubscriptionRow => ({
  id: 'x',
  name: 'Servis',
  amount: '50',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-15',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});
const overdueSub = subscriptionFromRow(row({ id: 'overdue-1', name: 'Eski Servis', amount: '100', next_renewal_date: '2026-10-10' }));
const upcomingSub = subscriptionFromRow(row({ id: 'up-1', name: 'Video Plus', next_renewal_date: '2026-10-15' }));
const trialSub = subscriptionFromRow(row({
  id: 'trial-1',
  name: 'Deneme Servis',
  amount: '0',
  status: 'trial',
  next_renewal_date: '2026-10-14',
  trial_end_date: '2026-10-14',
  trial_price_after: '30',
}));
const mockSubscriptions = [overdueSub, upcomingSub, trialSub];
const payment = (amount: string) => ({
  id: 'p1',
  subscriptionId: 'x',
  amount: Money.parse(amount),
  currency: 'TRY',
  paidAt: '2026-10-05T09:00:00Z',
  status: 'PAID' as const,
});
const ready = (data: unknown) => ({ data, isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user', displayName: 'Test', email: 'test@example.com' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../../stats/data/queries', () => ({ usePaymentsQuery: () => mockPayments() }));
jest.mock('../../subscriptions/ui/useRenewAction', () => ({ useRenewAction: () => ({ mutate: mockRenew, isPending: false, variables: undefined }) }));

beforeAll(() => {
  jest.useFakeTimers({ now: new Date('2026-10-13T09:00:00Z') });
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  mockPush.mockReset();
  mockNavigate.mockReset();
  mockRefetch.mockReset();
  mockRenew.mockReset();
  mockPayments.mockReset();
  mockPayments.mockReturnValue({ data: [], isPending: false, isError: false });
  mockUseSubscriptionsQuery.mockReset();
  mockUseSubscriptionsQuery.mockReturnValue(ready(mockSubscriptions));
});

it('hero kalan tutarı, ödenen ve toplamı gösterir', () => {
  mockPayments.mockReturnValue({ data: [payment('30')] });
  render(<DashboardScreen />);

  expect(screen.getByText('Bu ay kalan ödemeler')).toBeTruthy();
  expect(screen.getByText(/Ödenen.*30/)).toBeTruthy();
  expect(screen.getByText(/Toplam.*180/)).toBeTruthy();
  expect(screen.getByLabelText('Bu ay ödenen oran')).toBeTruthy();
});

it('hero kartı basılabilir ve İstatistikler ekranını açar', () => {
  render(<DashboardScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'Bu ay özetini aç, İstatistikler' }));
  expect(mockNavigate).toHaveBeenCalledWith('/stats');
});

it('ödemeler sorgusu hata verse de hero abonelik verisiyle çizilir', () => {
  mockPayments.mockReturnValue({ data: undefined, isError: true });
  render(<DashboardScreen />);

  expect(screen.getByText(/Ödenen.*0/)).toBeTruthy();
});

it('gecikmiş satır ve Ödendi onayı yenileme eylemini çalıştırır', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<DashboardScreen />);

  expect(screen.getByText('Dikkat gerektirenler')).toBeTruthy();
  expect(screen.getByText(/3 gün gecikti/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Ödendi' }));

  expect(alertSpy).toHaveBeenCalledWith('Eski Servis ödendi mi?', expect.stringContaining('Yenileme tarihi'), expect.any(Array));
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  buttons.find((button) => button.text === 'Ödendi')?.onPress?.();
  expect(mockRenew).toHaveBeenCalledWith(expect.objectContaining({ id: 'overdue-1' }));
  alertSpy.mockRestore();
});

it('dikkat gerektiren yoksa bölüm çizilmez', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([upcomingSub]));
  render(<DashboardScreen />);

  expect(screen.queryByText('Dikkat gerektirenler')).toBeNull();
});

it('zaman çizelgesi günlere göre gruplanır ve Takvim bağlantısı çalışır', () => {
  render(<DashboardScreen />);

  expect(screen.getByText('Önümüzdeki 14 gün')).toBeTruthy();
  expect(screen.getByText('Yarın')).toBeTruthy();
  expect(screen.getByText('15 Ekim · Perşembe')).toBeTruthy();
  expect(screen.getByText('Deneme bitiyor')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Takvim' }));
  expect(mockPush).toHaveBeenLastCalledWith('/calendar');
});

it('önümüzdeki 14 günde ödeme yoksa tek satır söyler', () => {
  mockUseSubscriptionsQuery.mockReturnValue(ready([overdueSub]));
  render(<DashboardScreen />);

  expect(screen.getByText('Önümüzdeki 14 günde ödeme yok.')).toBeTruthy();
});

it('hatırlatma kısayolu tek satırda görünür', () => {
  render(<DashboardScreen />);

  expect(screen.getAllByRole('button', { name: 'Hatırlatma ayarları' })).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: 'Hatırlatma ayarları' }));
  expect(mockPush).toHaveBeenLastCalledWith('/settings/notifications');
});

it('kategori dağılımı kartı İstatistikler ekranını açar', () => {
  render(<DashboardScreen />);

  fireEvent.press(screen.getByRole('button', { name: 'Bu ayın dağılımını aç, İstatistikler' }));
  expect(mockNavigate).toHaveBeenCalledWith('/stats');
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
  mockUseSubscriptionsQuery.mockReturnValue(ready([]));

  render(<DashboardScreen />);

  expect(screen.getByText('Ana sayfanı oluşturmaya başla')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'İlk aboneliğini ekle' }));
  expect(mockPush).toHaveBeenCalledWith('/subscriptions/add');
});
