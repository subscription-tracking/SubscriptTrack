import { fireEvent, render, screen } from '@testing-library/react-native';

import { PaymentMethodsScreen } from './PaymentMethodsScreen';

const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();
let mockPending = false;

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useMutation: () => ({ isPending: mockPending, mutate: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../data/paymentMethodsRepository', () => ({ fetchPaymentMethods: jest.fn(), savePaymentMethods: jest.fn() }));

describe('PaymentMethodsScreen', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUseQuery.mockReset();
    mockPending = false;
  });

  it('kaydetme sürerken yöntemleri değiştirme eylemlerini kapatır', () => {
    mockPending = true;
    mockUseQuery.mockReturnValue({ isPending: false, isError: false, data: ['Kişisel kart'], refetch: mockRefetch });
    render(<PaymentMethodsScreen />);
    expect(screen.getByRole('button', { name: 'Kişisel kart düzenle' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Kişisel kart sil' }).props.accessibilityState.disabled).toBe(true);
  });

  it('yüklenirken erişilebilir ilerleme durumunu gösterir', () => {
    mockUseQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });

    render(<PaymentMethodsScreen />);

    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('yükleme hatasında tekrar deneme eylemini bağlar', () => {
    mockUseQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });

    render(<PaymentMethodsScreen />);

    expect(screen.getByText('Ödeme yöntemleri yüklenemedi.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('boş durumda ikinci tekil metni gösterir ve değişiklik yokken Kaydet düğmesini çıkarmaz', () => {
    mockUseQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });

    render(<PaymentMethodsScreen />);

    expect(screen.getByText('Henüz ödeme yöntemi eklemedin.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Kaydet' })).toBeNull();
  });
});
