import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterScreen from '../../../../app/(auth)/register';
import ForgotPasswordScreen from '../../../../app/(auth)/forgot-password';
import ResetPasswordScreen from '../../../../app/(auth)/reset-password';

const mockSignUp = jest.fn();
const mockSendReset = jest.fn();
const mockUpdatePassword = jest.fn();
const mockShow = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  Stack: { Screen: () => null },
}));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children) };
});
jest.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ signUp: mockSignUp, sendPasswordResetEmail: mockSendReset, updatePassword: mockUpdatePassword }) }));
jest.mock('../../auth/domain/authErrors', () => ({ messageForError: (error: Error) => error.message }));
jest.mock('../../auth/ui/AuthScaffold', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthScaffold: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    AuthHeader: ({ title, subtitle }: { title: string; subtitle: string }) => React.createElement(View, null, React.createElement(Text, null, title), React.createElement(Text, null, subtitle)),
  };
});
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockShow }) }));

describe('Auth form screens', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSendReset.mockReset();
    mockUpdatePassword.mockReset();
    mockShow.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('kayıtta kullanım şartı onayını zorunlu tutar ve alanları doğrular', () => {
    render(<RegisterScreen />);
    expect(screen.getByRole('button', { name: 'Kayıt ol' }).props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByRole('checkbox'));
    fireEvent.press(screen.getByRole('button', { name: 'Kayıt ol' }));

    expect(screen.getByText('Geçerli bir e-posta gir')).toBeTruthy();
    expect(screen.getByText('Şifre gerekli.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('e-posta doğrulaması isteyen başarılı kaydı giriş ekranına yönlendirir', async () => {
    mockSignUp.mockResolvedValue({ requiresEmailConfirmation: true });
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByLabelText('E-posta'), ' user@example.com ');
    fireEvent.changeText(screen.getByLabelText('Şifre'), 'secure-pass-123');
    fireEvent.changeText(screen.getByLabelText('Şifre tekrar'), 'secure-pass-123');
    fireEvent.press(screen.getByRole('checkbox'));
    fireEvent.press(screen.getByRole('button', { name: 'Kayıt ol' }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('user@example.com', 'secure-pass-123'));
    expect(mockShow).toHaveBeenCalledWith('Doğrulama bağlantısını e-postana gönderdik. Gelen kutunu kontrol et.', 'primary');
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('parola sıfırlama adresini kırpar ve gönderildi durumunu gösterir', async () => {
    mockSendReset.mockResolvedValue(undefined);
    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByLabelText('E-posta'), ' user@example.com ');
    fireEvent.press(screen.getByRole('button', { name: 'Bağlantı gönder' }));

    await waitFor(() => expect(mockSendReset).toHaveBeenCalledWith('user@example.com'));
    expect(screen.getByText(/user@example.com adresine şifre sıfırlama bağlantısı gönderildi/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Giriş ekranına dön' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('yeni parola uyuşmuyorsa güncellemez, geçerliyse Auth mutasyonunu çağırır', async () => {
    mockUpdatePassword.mockResolvedValue(undefined);
    render(<ResetPasswordScreen />);
    fireEvent.changeText(screen.getByLabelText('Yeni şifre'), 'secure-pass-123');
    fireEvent.changeText(screen.getByLabelText('Şifreyi onayla'), 'different-pass-456');
    fireEvent.press(screen.getByRole('button', { name: 'Şifremi güncelle' }));
    expect(screen.getByText('Şifreler eşleşmiyor.')).toBeTruthy();
    expect(mockUpdatePassword).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Şifreyi onayla'), 'secure-pass-123');
    fireEvent.press(screen.getByRole('button', { name: 'Şifremi güncelle' }));
    await waitFor(() => expect(mockUpdatePassword).toHaveBeenCalledWith('secure-pass-123'));
    expect(mockShow).toHaveBeenCalledWith('Şifren güncellendi.');
  });
});
