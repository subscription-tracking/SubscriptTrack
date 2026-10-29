import { fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { CalendarScreen } from './CalendarScreen';

const mockRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: (...args: unknown[]) => mockUseSubscriptionsQuery(...args) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY', useUserTimeZone: () => 'Europe/Istanbul' }));

jest.mock('../../subscriptions/ui/useRenewAction', () => ({ useRenewAction: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }) }));

describe('CalendarScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));
    mockRefetch.mockReset();
    mockPush.mockReset();
    mockUseSubscriptionsQuery.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('abonelikler yüklenirken erişilebilir ilerleme durumunu gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });

    render(<CalendarScreen />);

    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
  });

  it('yükleme hatasında takvimi yeniden yükleyebilir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });

    render(<CalendarScreen />);

    expect(screen.getByText('Takvim yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('önbellek varsa yenileme hatasında takvimi korur ve tekrar dener', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: true, data: [], refetch: mockRefetch });
    render(<CalendarScreen />);
    expect(screen.getByText('Takvim verileri güncel olmayabilir.')).toBeTruthy();
    expect(screen.getByText('Ekim 2026')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('boş takvimde aylar arasında gezinir ve seçili güne abonelik eklemeyi açar', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });

    render(<CalendarScreen />);

    expect(screen.getByText('Ekim 2026')).toBeTruthy();
    expect(screen.getByText('Bu günde yenileme yok')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Sonraki ay' }));
    expect(screen.getByText('Kasım 2026')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Önceki ay' }));
    expect(screen.getByText('Ekim 2026')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: '11 Ekim 2026, bugün' }));
    fireEvent.press(screen.getByRole('button', { name: 'Bu tarihte başlayan abonelik ekle' }));
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/add?start=2026-10-11');
  });

  it('hafta günlerinin kısa görsel etiketleri için tam ve tekil ekran okuyucu adları sunar', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });
    render(<CalendarScreen />);

    expect(screen.getByLabelText('Pazartesi').props.accessibilityRole).toBe('text');
    expect(screen.getByLabelText('Pazar').props.accessibilityRole).toBe('text');
  });

  it('takvim lejantı yenileme, deneme bitişi ve aciliyet işaretlerini birbirinden ayırır', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });
    render(<CalendarScreen />);

    expect(screen.getByText('Yenileme')).toBeTruthy();
    expect(screen.getByText('Deneme bitişi')).toBeTruthy();
    expect(screen.getByText('3 gün içinde')).toBeTruthy();
  });

  it('gecikmiş aboneliği ayrı bölümde gösterir ve tekrarlayan yenilemeyi sonraki aya yansıtır', () => {
    const base = { id: 's1', name: 'Spotify', amount: '40', currency: 'TRY', billing_cycle: 'monthly', category: 'music', status: 'active', start_date: '2026-01-05', next_renewal_date: '2026-10-05', payment_method: null, notes: null, website: null, trial_end_date: null, trial_price_after: null };
    mockUseSubscriptionsQuery.mockReturnValue({ isPending: false, isError: false, data: [subscriptionFromRow(base as SubscriptionRow)], refetch: mockRefetch });

    render(<CalendarScreen />);

    expect(screen.getByText('Geciken ödemeler (1)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ödendi' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Sonraki ay' }));
    expect(screen.getByLabelText(/5 Kasım 2026.*yenileme var/)).toBeTruthy();
  });
});
