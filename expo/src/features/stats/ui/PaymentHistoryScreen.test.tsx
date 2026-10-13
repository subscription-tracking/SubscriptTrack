import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { paymentFromRow } from '../domain/paymentEvents';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';

const mockMutate = jest.fn();
const mockRefetchPayments = jest.fn();
const mockRefetchSubscriptions = jest.fn();
const mockUsePaymentsQuery = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();

const subscription = subscriptionFromRow({
  id: 'subscription-1',
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
} satisfies SubscriptionRow);
const payment = paymentFromRow({
  id: 'payment-1',
  subscription_id: 'subscription-1',
  amount: '49.90',
  currency: 'TRY',
  paid_at: '2026-10-11T09:00:00.000Z',
  status: 'PAID',
});

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-idempotency-key' }));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockMutate, isPending: false }), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../data/queries', () => ({ usePaymentsQuery: (...args: unknown[]) => mockUsePaymentsQuery(...args), analyticsKeys: { payments: (id: string) => ['payments', id] } }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../data/paymentRepository', () => ({ deletePayment: jest.fn(), recordPayment: jest.fn(), updatePayment: jest.fn() }));

describe('PaymentHistoryScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockRefetchPayments.mockReset();
    mockRefetchSubscriptions.mockReset();
    mockUsePaymentsQuery.mockReset();
    mockUseSubscriptionsQuery.mockReset();
    mockUsePaymentsQuery.mockReturnValue({ data: [payment], isPending: false, isError: false, refetch: mockRefetchPayments });
    mockUseSubscriptionsQuery.mockReturnValue({ data: [subscription], isPending: false, isError: false, refetch: mockRefetchSubscriptions });
  });

  it('abonelik veya ödeme verisi yüklenirken yükleme durumunu gösterir', () => {
    mockUsePaymentsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mockRefetchPayments });

    render(<PaymentHistoryScreen />);

    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('iki veri kaynağından biri hata verirse her ikisini yeniden dener', () => {
    mockUsePaymentsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: mockRefetchPayments });

    render(<PaymentHistoryScreen />);
    expect(screen.getByText('Ödeme geçmişi yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetchPayments).toHaveBeenCalledTimes(1);
    expect(mockRefetchSubscriptions).toHaveBeenCalledTimes(1);
  });

  it('ödeme yokken boş durumu ve ödeme ekleme eylemini gösterir', () => {
    mockUsePaymentsQuery.mockReturnValue({ data: [], isPending: false, isError: false, refetch: mockRefetchPayments });

    render(<PaymentHistoryScreen />);

    expect(screen.getByText('Henüz manuel ödeme kaydı yok.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ödeme kaydı ekle' })).toBeTruthy();
  });

  it('ödeme kaydını abonelik adıyla gösterir; düzenleme ve silme eylemleri kaydın kimliğini taşır', () => {
    render(<PaymentHistoryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Video Plus, ₺49,90 ödeme kaydını düzenle' }));
    expect(screen.getByText('Ödeme kaydını düzenle')).toBeTruthy();
    expect(screen.getByLabelText('Tutar (TRY)').props.value).toBe('49.90');

    fireEvent.press(screen.getByRole('button', { name: 'Video Plus, ₺49,90 ödeme kaydını sil' }));
    expect(mockMutate).toHaveBeenCalledWith('payment-1');
  });
});
