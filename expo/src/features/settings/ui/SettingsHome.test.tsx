import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsHome } from './SettingsHome';

const mockPush = jest.fn();
const mockPreference = { preference: 'light' as 'system' | 'light' | 'dark', ready: true, error: '', setPreference: jest.fn() };

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../../shared/design/useThemeRevision', () => ({ useThemeRevision: () => 0 }));
jest.mock('../../../shared/design/ThemeProvider', () => ({ useThemePreference: () => mockPreference }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: jest.fn() }) }));
jest.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada Lovelace' }, signOut: jest.fn() }),
}));
jest.mock('../data/useActiveCurrency', () => ({ useActiveCurrency: () => 'TRY' }));
jest.mock('../../notifications/data/notificationPrefs', () => ({ useNotifyPrefs: () => ({ data: { enabled: true } }) }));
jest.mock('../../onboarding/data/onboardingFlag', () => ({ resetOnboardingDone: jest.fn() }));
jest.mock('../data/paymentMethodsRepository', () => ({ fetchPaymentMethods: jest.fn(async () => []) }));
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [] }) }));

// Senaryo 49: tema seçimi Ayarlar ana ekranından erişilebilir ve mevcut tercihi gösterir.
describe('ayarlar ana ekranı tema satırı (senaryo 49)', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockPreference.preference = 'light';
  });

  it('mevcut tema tercihini değer olarak gösterir', () => {
    render(<SettingsHome />);
    expect(screen.getByText('Tema')).toBeTruthy();
    expect(screen.getAllByText('Açık').length).toBeGreaterThan(0);
  });

  it('tema satırına basınca tema seçimi ekranına gider', () => {
    render(<SettingsHome />);
    fireEvent.press(screen.getByText('Tema'));
    expect(mockPush).toHaveBeenCalledWith('/settings/appearance');
  });

  it('sistem tercihinde "Sistem" değerini gösterir', () => {
    mockPreference.preference = 'system';
    render(<SettingsHome />);
    expect(screen.getByText('Sistem')).toBeTruthy();
  });
});
