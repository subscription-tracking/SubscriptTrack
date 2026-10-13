import { act } from 'react';
import { AppState, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { NotificationPreferencesScreen } from './NotificationPreferencesScreen';

const mockRequestPermission = jest.fn();
const mockSave = jest.fn();
const mockSnackbar = jest.fn();
const mockCancelAll = jest.fn();
const mockSendTest = jest.fn();
const mockRefetch = jest.fn();
const mockUseNotifyPrefs = jest.fn();
const mockPermission = jest.fn();
const mockPermissionRefetch = jest.fn();

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbar }) }));
jest.mock('../data/notificationScheduler', () => ({ cancelAllReminders: (...args: unknown[]) => mockCancelAll(...args), sendTestReminder: (...args: unknown[]) => mockSendTest(...args) }));
jest.mock('../data/notificationPrefs', () => ({
  DEFAULT_DAYS_OPTIONS: [1, 3, 7],
  useNotifyPrefs: (...args: unknown[]) => mockUseNotifyPrefs(...args),
  useSetNotifyPrefs: () => mockSave,
}));
jest.mock('../data/notificationPermission', () => ({ useRequestPermission: () => mockRequestPermission, usePermissionQuery: () => mockPermission() }));

describe('NotificationPreferencesScreen', () => {
  beforeEach(() => {
    mockRequestPermission.mockReset();
    mockSave.mockReset();
    mockSnackbar.mockReset();
    mockCancelAll.mockReset();
    mockSendTest.mockReset();
    mockRefetch.mockReset();
    mockUseNotifyPrefs.mockReset();
    mockPermission.mockReset();
    mockPermissionRefetch.mockReset();
    mockPermission.mockReturnValue({ data: 'granted', refetch: mockPermissionRefetch });
    mockUseNotifyPrefs.mockReturnValue({ data: { enabled: true, defaultDays: 3, reminderHour: 9 }, isPending: false, isError: false, refetch: mockRefetch });
    mockSave.mockResolvedValue(undefined);
    mockCancelAll.mockResolvedValue(undefined);
    mockSendTest.mockResolvedValue(true);
  });

  it('yükleme ve hata durumlarını gösterir, hata sonrası tercihleri yeniden alır', () => {
    mockUseNotifyPrefs.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: mockRefetch });
    const loading = render(<NotificationPreferencesScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeTruthy();
    loading.unmount();

    mockUseNotifyPrefs.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch: mockRefetch });
    render(<NotificationPreferencesScreen />);
    expect(screen.getByText('Tercihler okunamadı.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('bildirim izni reddedilirse tercihi açmadan kullanıcıyı bilgilendirir', async () => {
    mockUseNotifyPrefs.mockReturnValue({ data: { enabled: false, defaultDays: 3, reminderHour: 9 }, isPending: false, isError: false, refetch: mockRefetch });
    mockRequestPermission.mockResolvedValue('denied');

    render(<NotificationPreferencesScreen />);
    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    await waitFor(() => expect(mockSnackbar).toHaveBeenCalledWith('Bildirim izni verilmedi. Ayarlardan açabilirsin.', 'error'));
    expect(mockSave).not.toHaveBeenCalled();
  });
  it('native permission and test scheduling failures are shown instead of rejecting unhandled', async () => {
    mockRequestPermission.mockRejectedValue(new Error('permission service unavailable'));
    render(<NotificationPreferencesScreen />);
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    await waitFor(() => expect(mockSnackbar).toHaveBeenCalledWith('permission service unavailable', 'error'));
    mockSendTest.mockRejectedValue(new Error('alarm service unavailable'));
    fireEvent.press(screen.getByRole('button', { name: 'Test bildirimi gönder' }));
    await waitFor(() => expect(mockSnackbar).toHaveBeenCalledWith(expect.stringContaining('Test bildirimi planlanamadı'), 'error'));
  });

  it('Expo Go bildirim modülü desteklenmiyorsa izni açma kontrolünü kapatıp açıklama gösterir', () => {
    mockUseNotifyPrefs.mockReturnValue({ data: { enabled: false, defaultDays: 3, reminderHour: 9 }, isPending: false, isError: false, refetch: mockRefetch });
    mockPermission.mockReturnValue({ data: 'unsupported' });

    render(<NotificationPreferencesScreen />);

    expect(screen.getByText('Bu Android Expo Go oturumunda yerel bildirim modülü başlatılamıyor. Geliştirme derlemesinde kullanılabilir.')).toBeTruthy();
    expect(screen.getByRole('switch').props.disabled).toBe(true);
  });

  it('gün seçimini hesaba kaydeder ve bildirimler kapatılınca zamanlanmış hatırlatmaları siler', async () => {
    render(<NotificationPreferencesScreen />);

    fireEvent.press(screen.getByRole('radio', { name: '7 gün önce' }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ enabled: true, defaultDays: 7, reminderHour: 9 }));

    fireEvent(screen.getByRole('switch'), 'valueChange', false);
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ enabled: false, defaultDays: 3, reminderHour: 9 }));
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });

  it('test bildirimi sonuç mesajını gösterir', async () => {
    render(<NotificationPreferencesScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Test bildirimi gönder, Bildirimlerin çalıştığını doğrula' }));

    await waitFor(() => expect(mockSendTest).toHaveBeenCalledTimes(1));
    expect(mockSnackbar).toHaveBeenCalledWith('Test bildirimi gönderildi.', 'primary');
  });

  it('bildirimler açıkken izin reddedilmişse uyarı bandı ve Ayarları aç düğmesi görünür', () => {
    mockPermission.mockReturnValue({ data: 'denied', refetch: mockPermissionRefetch });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    render(<NotificationPreferencesScreen />);

    expect(screen.getByText('Bildirim izni kapalı; hatırlatmalar gelmeyecek.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Ayarları aç' }));
    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  it('izin verilmişse ya da bildirimler kapalıysa uyarı bandı yoktur', () => {
    render(<NotificationPreferencesScreen />);
    expect(screen.queryByText('Bildirim izni kapalı; hatırlatmalar gelmeyecek.')).toBeNull();

    mockPermission.mockReturnValue({ data: 'denied', refetch: mockPermissionRefetch });
    mockUseNotifyPrefs.mockReturnValue({ data: { enabled: false, defaultDays: 3, reminderHour: 9 }, isPending: false, isError: false, refetch: mockRefetch });
    render(<NotificationPreferencesScreen />);
    expect(screen.queryByText('Bildirim izni kapalı; hatırlatmalar gelmeyecek.')).toBeNull();
  });

  it('uygulama öne dönünce izin durumunu yeniler', () => {
    let listener: ((state: string) => void) | undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      listener = handler as (state: string) => void;
      return { remove: jest.fn() };
    });
    render(<NotificationPreferencesScreen />);
    act(() => listener?.('active'));
    expect(mockPermissionRefetch).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
