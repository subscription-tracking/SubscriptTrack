import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { SubscriptionCancelScreen } from './SubscriptionCancelScreen';

const mockBack = jest.fn();
const mockMutate = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionQuery = jest.fn();
let mockMutationPending = false;

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

jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-idempotency-key' }));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockMutate, isPending: mockMutationPending }), useQueryClient: () => ({ invalidateQueries: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../data/queries', () => ({ subscriptionKeys: { all: (id: string) => ['subscriptions', id] }, useSubscriptionQuery: (...args: unknown[]) => mockUseSubscriptionQuery(...args) }));
jest.mock('../../savings/data/queries', () => ({ savingsKeys: { all: (id: string) => ['savings', id] } }));
jest.mock('../data/subscriptionMutations', () => ({ changeSubscriptionStatus: jest.fn() }));

describe('SubscriptionCancelScreen', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockMutate.mockReset();
    mockRefetch.mockReset();
    mockUseSubscriptionQuery.mockReset();
    mockMutationPending = false;
    mockUseSubscriptionQuery.mockReturnValue({ data: subscription, isPending: false, isError: false, refetch: mockRefetch });
  });

  it('aboneliği yüklerken ve hata aldığında tekrar deneme sunar', () => {
    mockUseSubscriptionQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mockRefetch });
    const loading = render(<SubscriptionCancelScreen id="subscription-1" />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseSubscriptionQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: mockRefetch });
    render(<SubscriptionCancelScreen id="subscription-1" />);
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('sağlayıcı sayfası yoksa iptal seçeneklerini ve devam et yolunu gösterir', () => {
    render(<SubscriptionCancelScreen id="subscription-1" />);

    expect(screen.getByText('Kayıtlı bir web sitesi yok. Sağlayıcının iptal sayfasını kendin açıp ardından "İptal ettim" seçeneğini kullan.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'İptal ettim. İptal tarihini ve varsa erişim bitişini kaydet.' })).toBeTruthy();
    expect(screen.getByText('İptal veya duraklatma işlemini önce sağlayıcıda yap. Buradaki seçim yalnızca uygulamadaki kaydı günceller.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Durdurdum. Sağlayıcıda duraklattıysan kaydın durumunu güncelle.' }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('iptal formunda tarihi onaylar ve kayıt mutasyonunu başlatır', () => {
    render(<SubscriptionCancelScreen id="subscription-1" />);
    fireEvent.press(screen.getByRole('button', { name: 'İptal ettim. İptal tarihini ve varsa erişim bitişini kaydet.' }));

    expect(screen.getByText('Sağlayıcıda iptal ettiğin tarihi gir. Durum "İptal edildi" olur ve tasarruf listesine eklenir.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'İptali kaydet' }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it('duraklatma isteği sürerken yinelenen basışı devre dışı bırakır', () => {
    mockMutationPending = true;
    render(<SubscriptionCancelScreen id="subscription-1" />);

    const pause = screen.getByRole('button', { name: 'Durdurdum. Sağlayıcıda duraklattıysan kaydın durumunu güncelle.' });
    expect(pause.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(pause);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
