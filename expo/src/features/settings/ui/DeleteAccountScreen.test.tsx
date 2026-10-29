import { fireEvent, render, screen } from '@testing-library/react-native';

import { DeleteAccountScreen } from './DeleteAccountScreen';

const mockMutate = jest.fn();
const mockOnline = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ isPending: false, mutate: mockMutate }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { email: 'test@example.com' }, signIn: mockSignIn, signOut: mockSignOut }) }));
jest.mock('../../../core/network/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../data/accountRepository', () => ({ DeleteAccountError: class extends Error {}, requestAccountDeletion: jest.fn() }));

describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockOnline.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
  });

  it('kalıcı silmenin kapsamını açıklar ve çevrimdışıyken silme eylemini kapatır', () => {
    mockOnline.mockReturnValue(false);

    render(<DeleteAccountScreen />);

    expect(screen.getByText('Bu işlem geri alınamaz. Hesabın ve tüm abonelik verilerin kalıcı olarak silinecek.')).toBeTruthy();
    expect(screen.getByText('Hesabını silmek için internet bağlantısı gerekir.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hesabı kalıcı olarak sil' }).props.accessibilityState.disabled).toBe(true);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('parola, sil onayı ve veri onayı olmadan silme isteği göndermez', () => {
    mockOnline.mockReturnValue(true);

    render(<DeleteAccountScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Hesabı kalıcı olarak sil' }));

    expect(screen.getByText('Devam etmek için şifreni gir')).toBeTruthy();
    expect(screen.getByText('Onaylamak için "sil" yaz')).toBeTruthy();
    expect(screen.getByText('Silinecek verileri anladığını onayla')).toBeTruthy();
    expect(screen.getByRole('checkbox').props.accessibilityHint).toContain('Silinecek verileri anladığını onayla');
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('gerekli üç onay tamamlanınca silme mutasyonunu başlatır', () => {
    mockOnline.mockReturnValue(true);

    render(<DeleteAccountScreen />);
    fireEvent.changeText(screen.getByLabelText('Şifre'), 'test-password');
    fireEvent.changeText(screen.getByLabelText('sil'), 'sil');
    fireEvent.press(screen.getByRole('checkbox'));
    fireEvent.press(screen.getByRole('button', { name: 'Hesabı kalıcı olarak sil' }));
    fireEvent.press(screen.getByRole('button', { name: 'Hesabı kalıcı olarak sil' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
