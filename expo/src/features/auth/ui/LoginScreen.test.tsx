import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '../../../../app/(auth)/login';

const mockSignIn = jest.fn();
const mockShow = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children: unknown }) => children,
}));

jest.mock('../AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

jest.mock('../../../shared/widgets/AppSnackbar', () => ({
  useSnackbar: () => ({ show: mockShow }),
}));

beforeEach(() => {
  mockSignIn.mockReset();
  mockShow.mockReset();
});

describe('LoginScreen', () => {
  it('başlık, alanlar ve bağlantılar Flutter metinleriyle görünür', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Tekrar hoş geldin')).toBeTruthy();
    expect(screen.getByText('Aboneliklerini yönetmek için giriş yap.')).toBeTruthy();
    expect(screen.getByLabelText('E-posta')).toBeTruthy();
    expect(screen.getByLabelText('Şifre')).toBeTruthy();
    expect(screen.getByText('Şifremi unuttum')).toBeTruthy();
    expect(screen.getByText('Hesabın yok mu? Kayıt ol')).toBeTruthy();
  });

  it('boş gönderimde Flutter doğrulama metinlerini gösterir ve giriş denemez', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(screen.getByText('Geçerli bir e-posta gir')).toBeTruthy();
    expect(screen.getByText('Şifre gerekli.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('geçerli girişte mockSignIn çağrılır', async () => {
    mockSignIn.mockResolvedValue(undefined);
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText('E-posta'), 'furkan@ornek.com');
    fireEvent.changeText(screen.getByLabelText('Şifre'), 'parola-123');
    fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(mockSignIn).toHaveBeenCalledWith('furkan@ornek.com', 'parola-123');
  });

  it('giriş hatasında snackbar hata tonuyla mesajı gösterir', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText('E-posta'), 'furkan@ornek.com');
    fireEvent.changeText(screen.getByLabelText('Şifre'), 'yanlis-parola');
    fireEvent.press(screen.getByRole('button', { name: 'Giriş yap' }));
    await waitFor(() => expect(mockShow).toHaveBeenCalledWith('E-posta veya şifre hatalı.', 'error'));
  });
});
