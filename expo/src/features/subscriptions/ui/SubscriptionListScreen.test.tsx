import { RefreshControl } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { type SubscriptionRow, subscriptionFromRow } from '../domain/subscription';
import { SubscriptionListScreen } from './SubscriptionListScreen';
jest.mock('./useDeletionAction', () => ({ useDeletionAction: () => ({ confirm: jest.fn(), busy: false }) }));

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockUseSubscriptionsQuery = jest.fn();
const mockArchivedUsd = subscriptionFromRow({
  id: 'archived-usd',
  name: 'USD arşiv kaydı',
  amount: '9.99',
  currency: 'USD',
  billing_cycle: 'monthly',
  category: 'software',
  status: 'archived',
  start_date: '2026-01-01',
  next_renewal_date: null,
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);
const mockNetflix = subscriptionFromRow({
  id: 'netflix',
  name: 'Netflix',
  amount: '15.00',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);
const mockDesignTool = subscriptionFromRow({
  id: 'design-tool',
  name: 'Design Suite',
  amount: '30.00',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'software',
  status: 'active',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-25',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);
const mockTrial = subscriptionFromRow({
  id: 'trial-one',
  name: 'Free Trial',
  amount: '0.00',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'music',
  status: 'trial',
  start_date: '2026-10-01',
  next_renewal_date: null,
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: '2026-10-18',
  trial_price_after: '12.00',
} satisfies SubscriptionRow);
const mockPaused = subscriptionFromRow({
  id: 'paused-one',
  name: 'Paused Service',
  amount: '8.00',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'cloud',
  status: 'paused',
  start_date: '2026-01-01',
  next_renewal_date: '2026-10-22',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
} satisfies SubscriptionRow);

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({
  useActiveCurrency: () => 'TRY',
  useUserTimeZone: () => 'Europe/Istanbul',
}));
jest.mock('../data/queries', () => ({
  useSubscriptionsQuery: () => mockUseSubscriptionsQuery(),
}));

describe('SubscriptionListScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefetch.mockReset();
    mockUseSubscriptionsQuery.mockReturnValue({
      data: [mockArchivedUsd],
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    });
  });

  it('arşiv bağlantısını gösterir, kaydın para birimi etkin para biriminden farklı olsa da', () => {
    render(<SubscriptionListScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Filtrele ve sırala' }));

    fireEvent.press(screen.getByRole('button', { name: 'Arşiv' }));

    expect(mockPush).toHaveBeenCalledWith('/subscriptions/archived');
  });

  it('yükleme hatasını gösterir ve yeniden denemeyi sorguya iletir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: true, isError: false, isRefetching: false, refetch: mockRefetch });
    const loading = render(<SubscriptionListScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseSubscriptionsQuery.mockReturnValue({ data: undefined, isPending: false, isError: true, isRefetching: false, refetch: mockRefetch });
    render(<SubscriptionListScreen />);
    expect(screen.getByText('Abonelikler yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('aktif listedeki aşağı çekme yenilemesini sorguya iletir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: [mockNetflix], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });

    render(<SubscriptionListScreen />);
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
  it('defaults to all currencies and combines currency, category, and search', () => {
    const usd = { ...mockDesignTool, id: 'usd', name: 'USD Suite', currency: 'USD' };
    mockUseSubscriptionsQuery.mockReturnValue({ data: [mockNetflix, usd], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });
    render(<SubscriptionListScreen />);
    expect(screen.getByRole('button', { name: /USD Suite, Yazılım/ })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Filtrele ve sırala' }));
    expect(screen.getByRole('radio', { name: 'Aylık eşdeğer: artan' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'USD' }));
    expect(screen.getByRole('radio', { name: 'Aylık eşdeğer: artan' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Yazılım' }));
    fireEvent.press(screen.getByRole('button', { name: 'Kapat' }));
    fireEvent.changeText(screen.getByLabelText('Aboneliklerinde ara'), 'Suite');
    expect(screen.getByRole('button', { name: /USD Suite, Yazılım/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Netflix/ })).toBeNull();
  });

  it('aramayı etkin para birimi ve seçili durum sekmesindeki kayıtlara uygular', () => {
    mockUseSubscriptionsQuery.mockReturnValue({
      data: [mockNetflix, mockDesignTool, mockArchivedUsd],
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<SubscriptionListScreen />);
    fireEvent.changeText(screen.getByLabelText('Aboneliklerinde ara'), 'netflix');

    expect(screen.getByRole('button', { name: /Netflix, Video & Dizi/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Design Suite/ })).toBeNull();
  });

  it('kategori filtresini uygular ve eşleşmeyen aramada boş sonuç gösterir', () => {
    mockUseSubscriptionsQuery.mockReturnValue({
      data: [mockNetflix, mockDesignTool],
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<SubscriptionListScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Filtrele ve sırala' }));
    fireEvent.press(screen.getByRole('button', { name: 'Yazılım' }));
    fireEvent.press(screen.getByRole('button', { name: 'Kapat' }));

    expect(screen.getByRole('button', { name: /Design Suite, Yazılım/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Netflix/ })).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Aboneliklerinde ara'), 'eşleşme-yok');
    expect(screen.getByText('Sonuç bulunamadı.')).toBeTruthy();
  });

  it('durum sekmelerinin sayaçlarını ve seçimini günceller, her durumda doğru kayıtları sunar', () => {
    mockUseSubscriptionsQuery.mockReturnValue({
      data: [mockNetflix, mockDesignTool, mockTrial, mockPaused],
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    });

    render(<SubscriptionListScreen />);

    expect(screen.getByRole('tab', { name: 'Aktif 2' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Deneme 1' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Geçmiş 1' })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Deneme 1' }));
    expect(screen.getByRole('tab', { name: 'Deneme 1' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: /Free Trial, Müzik/ })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Geçmiş 1' }));
    expect(screen.getByRole('tab', { name: 'Geçmiş 1' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('button', { name: /Paused Service, Bulut Depolama/ })).toBeTruthy();
  });
});

// Senaryo 23: hiç abonelik yokken anlaşılır boş durum gösterilir ve ekleme yönlendirmesi sunulur.
describe('boş liste durumu (senaryo 23)', () => {
  it('kayıt yokken aktif sekmede boş durum mesajını ve ekleme eylemini sunar', () => {
    mockUseSubscriptionsQuery.mockReturnValue({ data: [], isPending: false, isError: false, isRefetching: false, refetch: mockRefetch });
    render(<SubscriptionListScreen />);
    expect(screen.getByText('Aktif abonelik yok')).toBeTruthy();
    expect(screen.getAllByText('Abonelik ekle').length).toBeGreaterThan(0);
  });
});
