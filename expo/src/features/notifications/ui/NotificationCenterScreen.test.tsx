import { Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { type SubscriptionRow, subscriptionFromRow } from '../../subscriptions/domain/subscription';
import { NotificationCenterScreen } from './NotificationCenterScreen';
import { type CenterNotification } from '../data/notificationRepository';

const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockMarkRead = jest.fn();
const mockDismiss = jest.fn();
const mockMarkServerRead = jest.fn();
const mockConfirm = jest.fn();
const mockSnackbar = jest.fn();
const mockUseNotificationsQuery = jest.fn();
const mockUseNotificationLocalState = jest.fn();
let mockLocalRead = new Set<string>();
let mockSubscriptions: ReturnType<typeof subscriptionFromRow>[] = [];
let mockPrefs: { enabled: boolean } | undefined = { enabled: true };
let mockPermission: string | undefined = 'granted';

const notice: CenterNotification = {
  id: 'notice-1',
  kind: 'renewal_soon',
  subscriptionId: 'subscription-1',
  name: 'Video Plus',
  days: 3,
  createdAt: '2026-10-11T12:00:00.000Z',
  readAt: null,
};

const subscriptionRow = (overrides: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'subscription-1',
  name: 'Video Plus',
  amount: '99.90',
  currency: 'TRY',
  billing_cycle: 'monthly',
  category: 'streaming',
  status: 'active',
  start_date: '2026-01-13',
  next_renewal_date: '2026-10-20',
  payment_method: null,
  notes: null,
  website: null,
  trial_end_date: null,
  trial_price_after: null,
  ...overrides,
});

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@expo/vector-icons/FontAwesome6', () => 'FontAwesome6');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'test-user' } }) }));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../core/clock/useCivilToday', () => ({ useCivilToday: () => ({ year: 2026, month: 10, day: 13 }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbar }) }));
jest.mock('../../subscriptions/data/queries', () => ({ useSubscriptionsQuery: () => ({ data: mockSubscriptions }) }));
jest.mock('../../subscriptions/ui/useConfirmedRenew', () => ({ useConfirmedRenew: () => ({ confirm: mockConfirm, pendingId: undefined }) }));
jest.mock('../data/queries', () => ({ useNotificationsQuery: (...args: unknown[]) => mockUseNotificationsQuery(...args) }));
jest.mock('../data/notificationPrefs', () => ({ useNotifyPrefs: () => ({ data: mockPrefs }) }));
jest.mock('../data/notificationPermission', () => ({ usePermissionQuery: () => ({ data: mockPermission, refetch: jest.fn() }) }));
jest.mock('../data/notificationLocalState', () => ({ useNotificationLocalState: (...args: unknown[]) => mockUseNotificationLocalState(...args) }));
jest.mock('../data/notificationRepository', () => ({ markNotificationsRead: (...args: unknown[]) => mockMarkServerRead(...args) }));

function setNotices(data: CenterNotification[]) {
  mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: false, data, refetch: mockRefetch });
}

describe('NotificationCenterScreen', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefetch.mockReset();
    mockMarkRead.mockReset();
    mockDismiss.mockReset();
    mockMarkServerRead.mockReset();
    mockConfirm.mockReset();
    mockSnackbar.mockReset();
    mockLocalRead = new Set();
    mockSubscriptions = [];
    mockPrefs = { enabled: true };
    mockPermission = 'granted';
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

  it('hiç bildirim yokken açıklar ve bildirim ayarlarına götürür', () => {
    setNotices([]);

    render(<NotificationCenterScreen />);

    expect(screen.getByText('Yeni bildirim yok')).toBeTruthy();
    expect(screen.getByText('Yaklaşan yenilemeler burada görünür.')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Bildirim ayarları' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/notifications');
  });

  it('önbellekte bildirim varken yenileme hatasını ve tekrar denemeyi gösterir', () => {
    mockUseNotificationsQuery.mockReturnValue({ isPending: false, isError: true, data: [notice], refetch: mockRefetch });
    render(<NotificationCenterScreen />);
    expect(screen.getByText('Bildirimler güncel olmayabilir.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Video Plus, Yenilenmesine 3 gün kaldı/ })).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('satıra dokununca yerelde okundu sayar, sunucu eşitlemesini başlatır ve abonelik ayrıntısını açar', async () => {
    setNotices([notice]);

    const view = render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('button', { name: /Video Plus, Yenilenmesine 3 gün kaldı/ }));

    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1']);
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/subscription-1');
    // Flush the read-sync effect explicitly; polling a synchronous mock needlessly
    // depended on the wall-clock budget of a full-suite cold transform.
    await act(async () => { view.rerender(<NotificationCenterScreen />); });
    expect(mockMarkServerRead).toHaveBeenCalledWith(['notice-1']);
  });

  it('bildirimleri güne göre bölümlere ayırır', () => {
    setNotices([{ ...notice, id: 'notice-2', createdAt: '2020-01-01T12:00:00.000Z' }]);

    render(<NotificationCenterScreen />);

    expect(screen.getByText('Daha eski')).toBeTruthy();
  });

  it('üst çubuktaki tümünü okundu say yalnız okunmamış kimlikleri işaretler', () => {
    setNotices([notice, { ...notice, id: 'notice-2', subscriptionId: 'subscription-2', readAt: '2026-10-12T08:00:00.000Z' }]);

    render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Tümünü okundu işaretle' }));

    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1']);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('okunmamış yokken tümünü okundu say pasiftir; ayarlar düğmesi bildirim ayarlarını açar', () => {
    setNotices([{ ...notice, readAt: '2026-10-12T08:00:00.000Z' }]);

    render(<NotificationCenterScreen />);

    expect(screen.getByRole('button', { name: 'Tümünü okundu işaretle' }).props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByRole('button', { name: 'Bildirim ayarları' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/notifications');
  });

  it('filtre Okunmamış yalnız okunmamış grupları gösterir, Tümü hepsini döndürür', () => {
    setNotices([
      notice,
      { ...notice, id: 'notice-2', subscriptionId: 'subscription-2', name: 'Müzik Plus', readAt: '2026-10-12T08:00:00.000Z' },
    ]);

    render(<NotificationCenterScreen />);
    expect(screen.getByText('Müzik Plus')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Okunmamış (1)' }));
    expect(screen.getByText('Video Plus')).toBeTruthy();
    expect(screen.queryByText('Müzik Plus')).toBeNull();

    fireEvent.press(screen.getByRole('radio', { name: 'Tümü' }));
    expect(screen.getByText('Müzik Plus')).toBeTruthy();
  });

  it('okunmamış filtresi boşken açıklar ve Tümünü göster bağlantısı listeyi döndürür', () => {
    setNotices([{ ...notice, readAt: '2026-10-12T08:00:00.000Z' }]);

    render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('radio', { name: 'Okunmamış (0)' }));
    expect(screen.getByText('Okunmamış bildirim yok.')).toBeTruthy();

    fireEvent.press(screen.getByRole('link', { name: 'Tümünü göster' }));
    expect(screen.getByText('Video Plus')).toBeTruthy();
  });

  it('tekrarlayan bildirimleri ×N olarak toplar; okundu ve kapatma grubun tüm kimliklerine uygulanır', () => {
    setNotices([
      notice,
      { ...notice, id: 'notice-2', createdAt: '2026-10-10T12:00:00.000Z' },
      { ...notice, id: 'notice-3', createdAt: '2026-10-09T12:00:00.000Z' },
    ]);

    render(<NotificationCenterScreen />);

    expect(screen.getByText('×3')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Video Plus/ })).toHaveLength(1);
    const row = screen.getByRole('button', { name: /Video Plus, Yenilenmesine 3 gün kaldı, 3 kez, okunmamış/ });

    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'markRead' } });
    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1', 'notice-2', 'notice-3']);
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
    expect(mockDismiss).toHaveBeenCalledWith(['notice-1', 'notice-2', 'notice-3']);
  });

  it('vadesi gelmiş yenilemede Ödendi onayını başlatır ve Aboneliği aç bağlantısını gösterir', () => {
    mockSubscriptions = [subscriptionFromRow(subscriptionRow({ next_renewal_date: '2026-10-13' }))];
    setNotices([{ ...notice, kind: 'renewal_today', days: 0 }]);

    render(<NotificationCenterScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Ödendi' }));

    expect(mockConfirm).toHaveBeenCalledWith(mockSubscriptions[0]);
    fireEvent.press(screen.getByRole('link', { name: 'Aboneliği aç' }));
    expect(mockPush).toHaveBeenCalledWith('/subscriptions/subscription-1');
  });

  it('deneme türünde Ödendi çıkmaz, yalnız Aboneliği aç görünür', () => {
    mockSubscriptions = [subscriptionFromRow(subscriptionRow({ status: 'trial', next_renewal_date: '2026-10-12' }))];
    setNotices([{ ...notice, kind: 'trial_today', days: 0 }]);

    render(<NotificationCenterScreen />);

    expect(screen.queryByRole('button', { name: 'Ödendi' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Aboneliği aç' })).toBeTruthy();
  });

  it('vadesi gelmemiş ya da bulunamayan aboneliklerde eylem satırı çıkmaz', () => {
    mockSubscriptions = [subscriptionFromRow(subscriptionRow({ next_renewal_date: '2026-10-20' }))];
    setNotices([notice, { ...notice, id: 'notice-2', subscriptionId: 'silinmis', name: 'Eski Abonelik' }]);

    render(<NotificationCenterScreen />);

    expect(screen.queryByRole('button', { name: 'Ödendi' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Aboneliği aç' })).toBeNull();
  });

  it('erişilebilirlik eylemleri kapatma ve okundu sayma sunar', () => {
    setNotices([notice]);

    render(<NotificationCenterScreen />);
    const row = screen.getByRole('button', { name: /Video Plus/ });

    expect(row.props.accessibilityActions).toEqual([
      { name: 'dismiss', label: 'Kapat' },
      { name: 'markRead', label: 'Okundu say' },
    ]);
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
    expect(mockDismiss).toHaveBeenCalledWith(['notice-1']);
    row.props.onAccessibilityAction({ nativeEvent: { actionName: 'markRead' } });
    expect(mockMarkRead).toHaveBeenCalledWith(['notice-1']);
  });

  it('bildirimler açıkken izin reddedilmişse uyarı bandı çıkar ve cihaz ayarlarını açar', () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    mockPermission = 'denied';
    setNotices([notice]);

    render(<NotificationCenterScreen />);
    expect(screen.getByText('Bildirim izni kapalı; yeni hatırlatma gelmez.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Ayarları aç' }));

    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  it('izin verilmişse ya da bildirimler kapalıysa uyarı bandı çıkmaz', () => {
    setNotices([notice]);
    const granted = render(<NotificationCenterScreen />);
    expect(screen.queryByText('Bildirim izni kapalı; yeni hatırlatma gelmez.')).toBeNull();
    granted.unmount();

    mockPermission = 'denied';
    mockPrefs = { enabled: false };
    render(<NotificationCenterScreen />);
    expect(screen.queryByText('Bildirim izni kapalı; yeni hatırlatma gelmez.')).toBeNull();
  });
});
