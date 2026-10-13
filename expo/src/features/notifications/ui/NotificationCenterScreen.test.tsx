import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { NotificationCenterScreen } from './NotificationCenterScreen';
import { type CenterNotification } from '../data/notificationRepository';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockMarkRead = jest.fn();
const mockDismiss = jest.fn();
const mockMarkServerRead = jest.fn();
const mockUseNotificationsQuery = jest.fn();
const mockUseNotificationLocalState = jest.fn();
let mockLocalRead = new Set<string>();

const notice: CenterNotification = {
  id: 'notice-1',
  kind: 'renewal_soon',
  subscriptionId: 'subscription-1',
  name: 'Video Plus',
  days: 3,
  createdAt: '2026-10-11T12:00:00.000Z',
  readAt: null,
};

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: () => ({ data: [] }) }));
jest.mock('../data/queries', () => ({ useNotificationsQuery: (...args: unknown[]) => mockUseNotificationsQuery(...args) }));
jest.mock('../data/notificationLocalState', () => ({ useNotificationLocalState: (...args: unknown[]) => mockUseNotificationLocalState(...args) }));
jest.mock('../data/notificationRepository', () => ({ markNotificationsRead: (...args: unknown[]) => mockMarkServerRead(...args) }));

describe('NotificationCenterScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefetch.mockReset();
    mockMarkRead.mockReset();
    mockDismiss.mockReset();
    mockMarkServerRead.mockReset();
    mockLocalRead = new Set();
    mockUseNotificationsQuery.mockReset();
    mockUseNotificationLocalState.mockReset();
    mockMarkRead.mockImplementation((ids: string[]) => {
      mockLocalRead = new Set([...mockLocalRead, ...ids]);
    });
    mockUseNotificationLocalState.mockImplementation(() => ({ ready: true, read: mockLocalRead, dismissed: new Set<string>(), markRead: mockMarkRead, dismiss: mockDismiss }));
  });

  it('yükleme ve hata durumlarını gösterir, hatada yeniden denemeyi sağlar', () => {
    mockUseNotificationsQuery.mockReturnValue({ isPending: true, isError: false, data: undefined, refetch: mockRefetch });
    const loading = render(<NotificationCenterScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: true, data: undefined, refetch: mockRefetch });
    render(<NotificationCenterScreen />);
    expect(screen.getByText('Bildirimler yüklenemedi. Bağlantını kontrol edip tekrar dene.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('boş listeyi açıklar', () => {
    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: false, data: [], refetch: mockRefetch });

    render(<NotificationCenterScreen />);

    expect(screen.getByText('Yeni bildirim yok')).toBeTruthy();
    expect(screen.getByText('Yaklaşan yenilemeler burada görünür.')).toBeTruthy();
  });

  it('satıra dokununca yerelde okundu sayar, sunucu eşitlemesini başlatır ve abonelik ayrıntısını açar', async () => {
    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: false, data: [notice], refetch: mockRefetch });

    const view = render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('button', { name: /Video Plus, Yenilenmesine 3 gün kaldı/ }));

    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1']);
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/subscription-1');
    view.rerender(<NotificationCenterScreen />);
    await waitFor(() => expect(mockMarkServerRead).toHaveBeenCalledWith(['notice-1']));
  });

  it('bildirimleri güne göre bölümlere ayırır', () => {
    const old = { ...notice, id: 'notice-2', createdAt: '2020-01-01T12:00:00.000Z' };
    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: false, data: [old], refetch: mockRefetch });

    render(<NotificationCenterScreen />);

    expect(screen.getByText('Daha eski')).toBeTruthy();
  });

  it('tümünü okundu say eyleminde yalnız okunmamış bildirim kimliklerini işaretler', () => {
    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: false, data: [notice], refetch: mockRefetch });

    render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Tümünü okundu say' }));

    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1']);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
