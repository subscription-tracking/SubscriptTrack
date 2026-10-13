import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LockScreen } from './LockScreen';

const mockUnlock = jest.fn();
jest.mock('./appLockContext', () => ({
  useAppLock: () => ({
    unlockWithPin: mockUnlock,
    unlockWithBiometrics: jest.fn(),
    biometricEnabled: false,
    // Bağlamdaki değer denemeden ÖNCEKİ değeri taşır; ekran bunu kullanmamalı.
    attemptsLeft: 4,
    lockoutRemainingMs: 0,
  }),
}));
const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ signOut: mockSignOut }) }));
jest.mock('../../../shared/design/useThemeRevision', () => ({ useThemeRevision: () => 0 }));

function enterPin(digits: string) {
  for (const digit of digits) fireEvent.press(screen.getByRole('button', { name: digit }));
  fireEvent.press(screen.getByText('Aç'));
}

// Senaryo 59: yanlış PIN, denemeden sonraki güncel kalan hak sayısını gösterir.
describe('kilit ekranı yanlış PIN geri bildirimi (senaryo 59)', () => {
  beforeEach(() => mockUnlock.mockReset());

  it('mesajdaki kalan deneme sayısı sağlayıcının yeni değerinden gelir (eski değerden değil)', async () => {
    mockUnlock.mockResolvedValue({ result: 'wrong', attemptsLeft: 3, lockoutRemainingMs: 0 });
    render(<LockScreen />);
    enterPin('1234');
    await waitFor(() => expect(screen.getByText('PIN yanlış. Kalan deneme: 3')).toBeTruthy());
    expect(screen.queryByText('PIN yanlış. Kalan deneme: 4')).toBeNull();
  });

  it('kilitlenme durumunda bekleme süresini saniye olarak gösterir', async () => {
    mockUnlock.mockResolvedValue({ result: 'locked_out', attemptsLeft: 0, lockoutRemainingMs: 30000 });
    render(<LockScreen />);
    enterPin('1234');
    await waitFor(() => expect(screen.getByText(/30 sn sonra tekrar dene/)).toBeTruthy());
  });

  it('doğru PIN mesaj göstermez', async () => {
    mockUnlock.mockResolvedValue({ result: 'ok', attemptsLeft: 4, lockoutRemainingMs: 0 });
    render(<LockScreen />);
    enterPin('1234');
    await waitFor(() => expect(mockUnlock).toHaveBeenCalledWith('1234'));
    expect(screen.queryByText(/PIN yanlış/)).toBeNull();
  });
});

describe('kilit ekranı çıkış eylemi', () => {
  it('onay sonrası signOut çağırır, iptalde çağırmaz', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<LockScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Çıkış yap' }));
    const buttons = alert.mock.calls[0][2] ?? [];
    expect(mockSignOut).not.toHaveBeenCalled();
    buttons.find((button) => button.text === 'Çıkış yap')?.onPress?.();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
});
