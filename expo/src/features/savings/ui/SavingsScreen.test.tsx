import { fireEvent, render, screen } from '@testing-library/react-native';

import { Money } from '../../../core/domain/money';
import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { SavingsScreen } from './SavingsScreen';

const mockRefetchSubscriptions = jest.fn();
const mockRefetchSavings = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockUseSavingsQuery = jest.fn();

function subscription(id: string, name: string, amount: string, currency = 'TRY') {
  return subscriptionFromRow({
    id,
    name,
    amount,
    currency,
    billing_cycle: 'monthly',
    category: 'software',
    status: 'active',
    start_date: '2026-01-01',
    next_renewal_date: '2026-10-20',
    payment_method: null,
    notes: null,
    website: null,
    trial_end_date: null,
    trial_price_after: null,
  } satisfies SubscriptionRow);
}

const sampleSubscriptions = [
  subscription('one', 'First Service', '10.00'),
  subscription('two', 'Second Service', '20.00'),
  subscription('three', 'Third Service', '30.00'),
  subscription('four', 'Fourth Service', '40.00'),
  subscription('usd', 'USD Service', '99.00', 'USD'),
];
const sampleEvents = [
  { subscriptionId: 'paused-id', eventType: 'PAUSED', annual: Money.fromJson('120.00'), currency: 'TRY', effectiveAt: '2026-10-10T12:00:00.000Z' },
  { subscriptionId: 'usd-id', eventType: 'CANCELLED', annual: Money.fromJson('500.00'), currency: 'USD', effectiveAt: '2026-10-10T12:00:00.000Z' },
];

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../data/queries', () => ({ useSavingsQuery: (...args: unknown[]) => mockUseSavingsQuery(...args) }));

describe('SavingsScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));
    mockRefetchSubscriptions.mockReset();
    mockRefetchSavings.mockReset();
    mockUseSubscriptionsQuery.mockReset();
    mockUseSavingsQuery.mockReset();
    mockUseSubscriptionsQuery.mockReturnValue({ data: sampleSubscriptions, isPending: false, isError: false, refetch: mockRefetchSubscriptions });
    mockUseSavingsQuery.mockReturnValue({ data: sampleEvents, isPending: false, isError: false, refetch: mockRefetchSavings });
  });

  afterEach(() => jest.useRealTimers());

  it('abonelik ve tasarruf verileri yüklenirken yükleme göstergesini sunar', () => {
    mockUseSavingsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mockRefetchSavings });

    render(<SavingsScreen />);

    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('kaynaklardan biri hata verirse ikisini de yeniden yükler', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: mockRefetchSubscriptions });

    render(<SavingsScreen />);
    expect(screen.getByText('Tasarruf verisi yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetchSubscriptions).toHaveBeenCalledTimes(1);
    expect(mockRefetchSavings).toHaveBeenCalledTimes(1);
  });

  it('aktif abonelik yoksa boş durumu gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: [], isPending: false, isError: false, refetch: mockRefetchSubscriptions });

    render(<SavingsScreen />);

    expect(screen.getByText('Henüz abonelik yok.')).toBeTruthy();
  });

  it('aktif TRY kayıtlarından en yüksek üç yıllık fırsatı ve aynı para biriminin geçmişini gösterir', () => {
    render(<SavingsScreen />);

    expect(screen.getByText('En yüksek yıllık maliyetler')).toBeTruthy();
    expect(screen.getByText('İlk 3 abonelik yılda ₺1.080,00 tutuyor.')).toBeTruthy();
    expect(screen.getByText('Yıllık maliyetler')).toBeTruthy();
    expect(screen.queryByText('Olası yıllık tasarruf')).toBeNull();
    expect(screen.getByText('Fourth Service')).toBeTruthy();
    expect(screen.getByText('Diğer abonelikler')).toBeTruthy();
    expect(screen.getByText('First Service')).toBeTruthy();
    expect(screen.getByText('İptal ve duraklatma geçmişi')).toBeTruthy();
    expect(screen.getByText('Duraklatıldı · 10 Ekim 2026')).toBeTruthy();
    expect(screen.queryByText('USD Service')).toBeNull();
    expect(screen.queryByText(/İptal edildi/)).toBeNull();
  });
});
