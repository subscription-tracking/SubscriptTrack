import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { AppLockProvider } from './AppLockProvider';
import { useAppLock } from './appLockContext';

const mockReadAppLock = jest.fn();
const mockWriteAttempts = jest.fn();
const mockWritePinRecord = jest.fn();
const mockVerifyPinRecord = jest.fn();
const mockPinRecordNeedsUpgrade = jest.fn();
const mockCreatePinRecord = jest.fn();
const mockUser = { id: 'test-user' };

jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('expo-screen-capture', () => ({ usePreventScreenCapture: jest.fn() }));
jest.mock('../data/appLockStore', () => ({
  readAppLock: (...args: unknown[]) => mockReadAppLock(...args),
  writeAttempts: (...args: unknown[]) => mockWriteAttempts(...args),
  writePinRecord: (...args: unknown[]) => mockWritePinRecord(...args),
}));
jest.mock('../data/biometrics', () => ({ authenticateWithBiometrics: jest.fn() }));
jest.mock('../../../core/security/pinRecord', () => ({
  createPinRecord: (...args: unknown[]) => mockCreatePinRecord(...args),
  pinRecordNeedsUpgrade: (...args: unknown[]) => mockPinRecordNeedsUpgrade(...args),
  verifyPinRecord: (...args: unknown[]) => mockVerifyPinRecord(...args),
}));
jest.mock('./LockScreen', () => ({ LockScreen: () => null }));

function UnlockProbe() {
  const lock = useAppLock();
  return (
    <>
      <Text>{lock.locked ? 'locked' : 'unlocked'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="unlock" onPress={() => void lock.unlockWithPin('1234')} />
    </>
  );
}

describe('AppLockProvider PIN yükseltmesi', () => {
  beforeEach(() => {
    mockUser.id = 'test-user';
    mockReadAppLock.mockReset().mockResolvedValue({
      pinRecord: 'legacy-flutter-hash',
      biometric: false,
      timeoutMinutes: 1,
      failed: 2,
      lockedUntil: null,
    });
    mockWriteAttempts.mockReset().mockResolvedValue(undefined);
    mockWritePinRecord.mockReset().mockResolvedValue(undefined);
    mockVerifyPinRecord.mockReset().mockResolvedValue(true);
    mockPinRecordNeedsUpgrade.mockReset().mockReturnValue(true);
    mockCreatePinRecord.mockReset().mockResolvedValue('v2:30000:new-salt:new-digest');
  });

  it('eski Flutter PIN kaydını kabul eder, yeni biçime yükseltir ve deneme sayacını sıfırlar', async () => {
    render(
      <AppLockProvider>
        <UnlockProbe />
      </AppLockProvider>,
    );

    await waitFor(() => expect(screen.getByText('locked', { includeHiddenElements: true })).toBeTruthy());
    fireEvent.press(screen.getByLabelText('unlock', { includeHiddenElements: true }));

    await waitFor(() => expect(screen.getByText('unlocked', { includeHiddenElements: true })).toBeTruthy());
    expect(mockVerifyPinRecord).toHaveBeenCalledWith('1234', 'legacy-flutter-hash');
    expect(mockCreatePinRecord).toHaveBeenCalledWith('1234');
    expect(mockWritePinRecord).toHaveBeenCalledWith('test-user', 'v2:30000:new-salt:new-digest');
    expect(mockWriteAttempts).toHaveBeenCalledWith('test-user', 0, null);
  });

  it('depo hatasında içeriği gizler ve tekrar denemeden sonra kilitli durumu yükler', async () => {
    mockReadAppLock.mockRejectedValueOnce(new Error('storage unavailable'));
    render(<AppLockProvider><UnlockProbe /></AppLockProvider>);
    await waitFor(() => expect(screen.getByText('Güvenli kilit verisi okunamadı.')).toBeTruthy());
    expect(screen.queryByText('unlocked', { includeHiddenElements: true })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Kilidi tekrar yükle' }));
    await waitFor(() => expect(screen.getByText('locked', { includeHiddenElements: true })).toBeTruthy());
  });

  it('doğru PIN sonrası deneme sayacı yazılamazsa içeriği açmaz', async () => {
    mockWriteAttempts.mockRejectedValueOnce(new Error('storage unavailable'));
    render(<AppLockProvider><UnlockProbe /></AppLockProvider>);
    await waitFor(() => expect(screen.getByText('locked', { includeHiddenElements: true })).toBeTruthy());
    fireEvent.press(screen.getByLabelText('unlock', { includeHiddenElements: true }));
    await waitFor(() => expect(screen.getByText('Güvenli kilit verisi okunamadı.')).toBeTruthy());
    expect(screen.queryByText('unlocked', { includeHiddenElements: true })).toBeNull();
  });
  it('kilitliyken içerik erişilebilirlikten gizlenir ve kilit paylaşılan duruma yazılır', async () => {
    const view = render(<AppLockProvider><UnlockProbe /></AppLockProvider>);
    await waitFor(() => expect(screen.getByText('locked', { includeHiddenElements: true })).toBeTruthy());
    const hidden = (node: { props: Record<string, unknown> }) => node.props.importantForAccessibility === 'no-hide-descendants' && node.props.accessibilityElementsHidden === true;
    expect(view.UNSAFE_getAllByProps({ importantForAccessibility: 'no-hide-descendants' }).length).toBeGreaterThan(0);
    expect(hidden(view.UNSAFE_getAllByProps({ importantForAccessibility: 'no-hide-descendants' })[0])).toBe(true);
    fireEvent.press(screen.getByLabelText('unlock', { includeHiddenElements: true }));
    await waitFor(() => expect(screen.getByText('unlocked', { includeHiddenElements: true })).toBeTruthy());
    expect(view.UNSAFE_queryAllByProps({ importantForAccessibility: 'no-hide-descendants' })).toHaveLength(0);
  });
  it('hides content immediately and relocks when the account changes', async () => {
    const view = render(<AppLockProvider><UnlockProbe /></AppLockProvider>);
    await waitFor(() => expect(screen.getByText('locked', { includeHiddenElements: true })).toBeTruthy());
    fireEvent.press(screen.getByLabelText('unlock', { includeHiddenElements: true }));
    await waitFor(() => expect(screen.getByText('unlocked', { includeHiddenElements: true })).toBeTruthy());
    mockUser.id = 'different-user';
    mockReadAppLock.mockReturnValueOnce(new Promise(() => undefined));
    view.rerender(<AppLockProvider><UnlockProbe /></AppLockProvider>);
    expect(screen.queryByText('unlocked', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText('Güvenli kilit yükleniyor…')).toBeTruthy();
  });
});
