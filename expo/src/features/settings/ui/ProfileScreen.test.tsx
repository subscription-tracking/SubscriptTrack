import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileScreen } from './ProfileScreen';

const mockMutate = jest.fn();
const mockUpdateDisplayName = jest.fn();
const mockUpdateEmail = jest.fn();
const mockUpdatePassword = jest.fn();
const mockSignIn = jest.fn();
const mockSnackbar = jest.fn();

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockMutate, isPending: false }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'person@example.com', displayName: 'Ada', createdAt: '2024-01-15T12:00:00.000Z' },
    updateDisplayName: mockUpdateDisplayName,
    updateEmail: mockUpdateEmail,
    updatePassword: mockUpdatePassword,
    signIn: mockSignIn,
  }),
}));
jest.mock('../../settings/data/useActiveCurrency', () => ({ useUserTimeZone: () => 'Europe/Istanbul' }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbar }) }));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUpdateDisplayName.mockReset();
    mockUpdateEmail.mockReset();
    mockUpdatePassword.mockReset();
    mockSignIn.mockReset();
    mockSnackbar.mockReset();
  });

  it('hesap e-postasını, görünen adı ve üyelik tarihini gösterir; değişmemiş alanları kaydetmeye açmaz', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('person@example.com')).toBeTruthy();
    expect(screen.getByText(/Üyelik tarihi:/)).toBeTruthy();
    expect(screen.getByLabelText('Adın').props.value).toBe('Ada');
    expect(screen.queryByRole('button', { name: 'Adı kaydet' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'E-postayı güncelle' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Şifreyi güncelle' })).toBeNull();
  });

  it('isim ve e-posta değişikliklerini ayrı kaydetme mutasyonlarına yollar', () => {
    render(<ProfileScreen />);

    fireEvent.changeText(screen.getByLabelText('Adın'), 'Ada Lovelace');
    fireEvent.press(screen.getByRole('button', { name: 'Adı kaydet' }));
    expect(mockMutate).toHaveBeenCalledTimes(1);

    fireEvent.changeText(screen.getByLabelText('E-posta'), 'ada@example.com');
    fireEvent.press(screen.getByRole('button', { name: 'E-postayı güncelle' }));
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });

  it('yeni şifre kurala uymadan veya tekrar alanıyla eşleşmeden güncellemeyi açmaz', () => {
    render(<ProfileScreen />);
    expect(screen.queryByRole('button', { name: 'Şifreyi güncelle' })).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Mevcut şifre'), 'old');
    fireEvent.changeText(screen.getByLabelText('Yeni şifre (en az 10 karakter)'), 'short');
    fireEvent.changeText(screen.getByLabelText('Yeni şifre (tekrar)'), 'short');
    expect(screen.getByRole('button', { name: 'Şifreyi güncelle' }).props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Yeni şifre (en az 10 karakter)'), 'long-password');
    expect(screen.getByRole('button', { name: 'Şifreyi güncelle' }).props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Yeni şifre (tekrar)'), 'long-password');
    expect(screen.getByRole('button', { name: 'Şifreyi güncelle' }).props.accessibilityState.disabled).toBe(false);
    fireEvent.press(screen.getByRole('button', { name: 'Şifreyi güncelle' }));
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
