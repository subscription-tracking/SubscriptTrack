import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { StatsScreen } from './StatsScreen';

const mockPush = jest.fn();
const mockSubscriptions = jest.fn();
const mockPayments = jest.fn();
const mockOnline = jest.fn(() => true);
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: () => mockSubscriptions() }));
jest.mock('../data/queries', () => ({ usePaymentsQuery: () => mockPayments() }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('./cards/HeroSpendingCard', () => ({ HeroSpendingCard: () => null }));
jest.mock('./cards/TrendCard', () => ({ TrendCard: () => null }));
jest.mock('./cards/InsightsCard', () => ({ InsightsCard: () => null }));
jest.mock('./cards/CategoryBreakdownCard', () => ({ CategoryBreakdownCard: () => null }));
jest.mock('./cards/ActionCards', () => { const { Pressable, Text } = jest.requireActual('react-native'); return { ActionCards: ({ onSavings, onPaymentHistory }: { onSavings: () => void; onPaymentHistory: () => void }) => (
  <>
    <Pressable accessibilityRole="button" onPress={onSavings}><Text>Tasarruf</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={onPaymentHistory}><Text>Ödeme geçmişi</Text></Pressable>
  </>
) }; });

const activeSubscription = subscriptionFromRow({
  id: 'active-one', name: 'Music', amount: '10.00', currency: 'TRY', billing_cycle: 'monthly',
  category: 'music', status: 'active', start_date: '2026-01-01', next_renewal_date: '2026-10-20',
  payment_method: null, notes: null, website: null, trial_end_date: null, trial_price_after: null,
} satisfies SubscriptionRow);

describe('StatsScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSubscriptions.mockReset();
    mockPayments.mockReset();
    mockOnline.mockReturnValue(true);
    mockSubscriptions.mockReturnValue({ data: [], isPending: false, isError: false, refetch: jest.fn() });
    mockPayments.mockReturnValue({ data: [], isPending: false, isError: false, refetch: jest.fn() });
  });

  it('iki veri kaynağından biri yüklenirken ilerleme durumunu gösterir', () => {
    mockPayments.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: jest.fn() });
    render(<StatsScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('veri hatasında her iki sorguyu yeniden dener', () => {
    const retrySubscriptions = jest.fn();
    const retryPayments = jest.fn();
    mockSubscriptions.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: retrySubscriptions });
    mockPayments.mockReturnValue({ data: [], isPending: false, isError: false, refetch: retryPayments });
    render(<StatsScreen />);

    expect(screen.getByText('İstatistikler yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(retrySubscriptions).toHaveBeenCalledTimes(1);
    expect(retryPayments).toHaveBeenCalledTimes(1);
  });

  it('önbellekteki veriyi yenileme hatasında uyarıyla korur', () => {
    mockSubscriptions.mockReturnValue({ data: [activeSubscription], isPending: false, isError: true, refetch: jest.fn() });
    render(<StatsScreen />);
    expect(screen.getByText(/analiz güncel olmayabilir/)).toBeTruthy();
    expect(screen.queryByText(/İstatistikler yüklenemedi/)).toBeNull();
  });

  it('birden çok para biriminde üstte seçici çıkar ve seçimi değiştirir', () => {
    const usd = { ...activeSubscription, id: 'usd-one', currency: 'USD' };
    mockSubscriptions.mockReturnValue({ data: [activeSubscription, usd], isPending: false, isError: false, refetch: jest.fn() });
    render(<StatsScreen />);
    expect(screen.getByRole('radio', { name: 'TRY' }).props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByRole('radio', { name: 'USD' }));
    expect(screen.getByRole('radio', { name: 'USD' }).props.accessibilityState.checked).toBe(true);
  });

  it('tek para biriminde seçici çıkmaz', () => {
    mockSubscriptions.mockReturnValue({ data: [activeSubscription], isPending: false, isError: false, refetch: jest.fn() });
    render(<StatsScreen />);
    expect(screen.queryByRole('radio', { name: 'USD' })).toBeNull();
  });

  it('aktif abonelik yokken ilk kaydı eklemeye yönlendirir', () => {
    render(<StatsScreen />);
    expect(screen.getByText('Henüz analiz yok')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'İlk aboneliğini ekle' }));
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/add');
    fireEvent.press(screen.getByRole('button', { name: 'Ödeme geçmişi' }));
    fireEvent.press(screen.getByRole('button', { name: 'Tasarruf' }));
    expect(mockPush).toHaveBeenCalledWith('/stats/payments');
    expect(mockPush).toHaveBeenCalledWith('/savings');
  });

  it('analiz kartlarından tasarruf ve ödeme geçmişine gider', () => {
    mockSubscriptions.mockReturnValue({ data: [activeSubscription], isPending: false, isError: false, refetch: jest.fn() });
    render(<StatsScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Tasarruf' }));
    fireEvent.press(screen.getByRole('button', { name: 'Ödeme geçmişi' }));

    expect(mockPush).toHaveBeenNthCalledWith(1, '/savings');
    expect(mockPush).toHaveBeenNthCalledWith(2, '/stats/payments');
  });
});
