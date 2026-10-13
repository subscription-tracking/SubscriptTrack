import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppLockSettingsScreen } from './AppLockSettingsScreen';

const mockMutate = jest.fn();
const mockSnackbar = jest.fn();
const mockRefresh = jest.fn();
const mockLock = { enabled: false, biometricEnabled: false, timeoutMinutes: 1, refresh: mockRefresh };

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockMutate, isPending: false }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbar }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
jest.mock('./appLockContext', () => ({ useAppLock: () => mockLock }));
jest.mock('../data/biometrics', () => ({ biometricsAvailable: jest.fn().mockResolvedValue(false) }));
jest.mock('../data/appLockStore', () => ({ readAppLock: jest.fn(), writeBiometric: jest.fn(), writePinRecord: jest.fn(), writeTimeoutMinutes: jest.fn() }));
jest.mock('../../../core/security/pinRecord', () => ({ createPinRecord: jest.fn(), verifyPinRecord: jest.fn() }));

describe('AppLockSettingsScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockSnackbar.mockReset();
    mockRefresh.mockReset();
    mockLock.enabled = false;
    mockLock.biometricEnabled = false;
    mockLock.timeoutMinutes = 1;
  });

  it('PIN kilidi kapalıyken geçersiz PIN’i reddeder ve geçerli 4 haneli PIN’i etkinleştirmeye yollar', () => {
    render(<AppLockSettingsScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'PIN’i etkinleştir' }));
    expect(screen.getByText('PIN 4–8 rakam olmalı')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Yeni PIN'), '1234');
    fireEvent.changeText(screen.getByLabelText('Yeni PIN (tekrar)'), '4321');
    fireEvent.press(screen.getByRole('button', { name: 'PIN’i etkinleştir' }));
    expect(screen.getByText('PIN’ler eşleşmiyor')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Yeni PIN (tekrar)'), '1234');
    fireEvent.press(screen.getByRole('button', { name: 'PIN’i etkinleştir' }));
    expect(mockMutate).toHaveBeenCalledWith({ pin: '1234' });
  });

  it('mevcut PIN doğrulanmadan değiştirmez/kapatmaz; PIN’ler eşleşince mevcut PIN’i taşır', () => {
    mockLock.enabled = true;
    const { getByRole } = render(<AppLockSettingsScreen />);

    fireEvent.press(getByRole('button', { name: 'PIN’i değiştir' }));
    expect(screen.getByText('Mevcut PIN’ini gir')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Mevcut PIN'), '1234');
    fireEvent.changeText(screen.getByLabelText('Yeni PIN'), '5678');
    fireEvent.changeText(screen.getByLabelText('Yeni PIN (tekrar)'), '0000');
    fireEvent.press(getByRole('button', { name: 'PIN’i değiştir' }));
    expect(screen.getByText('Yeni PIN’ler eşleşmiyor')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Yeni PIN (tekrar)'), '5678');
    fireEvent.press(getByRole('button', { name: 'PIN’i değiştir' }));
    expect(mockMutate).toHaveBeenCalledWith({ pin: '5678', current: '1234' });

    mockMutate.mockReset();
    fireEvent.changeText(screen.getByLabelText('Mevcut PIN'), '1234');
    fireEvent.press(getByRole('button', { name: 'Kilidi kapat' }));
    expect(mockMutate).toHaveBeenCalledWith('1234');
  });

  it('kilit açıkken kilit süresini seçilen dakikayla kaydeder', () => {
    mockLock.enabled = true;

    render(<AppLockSettingsScreen />);
    expect(screen.getByRole('radio', { name: '1 dakika sonra' }).props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByRole('radio', { name: '5 dakika sonra' }));

    expect(mockMutate).toHaveBeenCalledWith(5);
  });
});
