import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { SubscriptionArchivedScreen } from './SubscriptionArchivedScreen';

const mockPush = jest.fn();
const mockMutate = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockDeleteSubscription = jest.fn();
const mockMutationFns: ((value: unknown) => Promise<unknown>)[] = [];
const mockMutationPending: boolean[] = [];
let mockMutationCall = 0;
let mockOnline = true;
const archived = subscriptionFromRow({
  id: 'archived-1',
  name: 'Old Service',
  amount: '29.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'software',
  status: 'archived',
  is_archived: true,
  start_date: '2026-01-01',
  next_renewal_date: null,
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-idempotency-key' }));
jest.mock('@tanstack/react-query', () => ({
  useMutation: (options: { mutationFn: (value: unknown) => Promise<unknown> }) => {
    const index = mockMutationCall++;
    mockMutationFns.push(options.mutationFn);
    return { mutate: mockMutate, isPending: mockMutationPending[index] ?? false };
  },
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../data/queries', () => ({ subscriptionKeys: { all: (id: string) => ['subscriptions', id] }, useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../../savings/data/queries', () => ({ savingsKeys: { all: (id: string) => ['savings', id] } }));
jest.mock('../data/subscriptionMutations', () => ({ changeSubscriptionStatus: jest.fn() }));
jest.mock('../data/subscriptionWriteRepository', () => ({ deleteSubscription: (...args: unknown[]) => mockDeleteSubscription(...args) }));

describe('SubscriptionArchivedScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockMutate.mockReset();
    mockRefetch.mockReset();
    mockDeleteSubscription.mockReset();
    mockMutationFns.length = 0;
    mockMutationPending.length = 0;
    mockMutationCall = 0;
    mockOnline = true;
    mockUseSubscriptionsQuery.mockReset();
    mockUseSubscriptionsQuery.mockReturnValue({ data: [archived], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });
  });

  it('loading/error/empty durumlarını gösterir ve hata sonrası yeniden dener', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, isRefetching: false, refetch: mockRefetch });
    const loading = render(<SubscriptionArchivedScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, isRefetching: false, refetch: mockRefetch });
    render(<SubscriptionArchivedScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('arşiv boşken boş ekranı gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: [], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });

    render(<SubscriptionArchivedScreen />);

    expect(screen.getByText('Arşivlenmiş abonelik yok')).toBeTruthy();
  });

  it('arşiv kaydını açar ve geri yükleme mutasyonuna aynı kaydı verir', () => {
    render(<SubscriptionArchivedScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Old Service, Aylık, ₺29,90, Yazılım' }));
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/archived-1');
    fireEvent.press(screen.getByRole('button', { name: 'Old Service aboneliğini aktif yap' }));
    expect(mockMutate).toHaveBeenCalledWith(archived);
  });

  it('kalıcı silme açıklamasını gösterir ve yalnızca yanlış kayıt onayıyla silme mutasyonunu çağırır', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<SubscriptionArchivedScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Old Service aboneliğini yanlış kayıt olarak sil' }));

    const [title, message, buttons] = alert.mock.calls[0] ?? [];
    expect(title).toBe('Yanlış oluşturulan kaydı sil');
    expect(message).toContain('yalnızca yanlış oluşturulmuş bir kayıt ise silinebilir');
    expect(message).toContain('geri alınamaz');
    expect(mockMutate).not.toHaveBeenCalled();
    buttons?.find((button) => button.text === 'Evet, yanlış kayıt')?.onPress?.();
    expect(mockMutate).toHaveBeenCalledWith(archived);
    alert.mockRestore();
  });

  it('çevrimdışıyken kalıcı silme isteğini API’ye göndermez', async () => {
    mockOnline = false;
    render(<SubscriptionArchivedScreen />);

    await expect(Promise.resolve().then(() => mockMutationFns[0](archived))).rejects.toThrow('Silmek için internet bağlantısı gerekir.');
    expect(mockDeleteSubscription).not.toHaveBeenCalled();
  });

  it('geri yükleme ve silme sürerken iki eylemi de devre dışı bırakır', () => {
    mockMutationPending.push(true, true);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<SubscriptionArchivedScreen />);

    const restore = screen.getByRole('button', { name: 'Old Service aboneliğini aktif yap' });
    const remove = screen.getByRole('button', { name: 'Old Service aboneliğini yanlış kayıt olarak sil' });
    expect(restore.props.accessibilityState.disabled).toBe(true);
    expect(remove.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(restore);
    fireEvent.press(remove);
    expect(mockMutate).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
