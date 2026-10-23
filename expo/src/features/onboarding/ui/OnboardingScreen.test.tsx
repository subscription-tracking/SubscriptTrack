import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList, Dimensions } from 'react-native';

import { OnboardingScreen } from './OnboardingScreen';

const mockReplace = jest.fn();
const mockMarkDone = jest.fn();
const mockReadCurrency = jest.fn();
const mockWriteCurrency = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../data/onboardingFlag', () => ({ useOnboardingFlag: () => ({ markDone: mockMarkDone }) }));
jest.mock('../data/currencyPreference', () => ({ readDeviceCurrency: (...args: unknown[]) => mockReadCurrency(...args), writeDeviceCurrency: (...args: unknown[]) => mockWriteCurrency(...args) }));
jest.mock('../../../shared/widgets/AmbientBackground', () => { const React = jest.requireActual<typeof import('react')>('react'); return { AmbientBackground: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) }; });
jest.mock('../../../shared/widgets/EntranceFade', () => { const React = jest.requireActual<typeof import('react')>('react'); return { EntranceFade: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children) }; });
jest.mock('./illustrations/SubscriptionsIllustration', () => ({ SubscriptionsIllustration: () => null }));
jest.mock('./illustrations/CalendarIllustration', () => ({ CalendarIllustration: () => null }));
jest.mock('./illustrations/AnalyticsIllustration', () => ({ AnalyticsIllustration: () => null }));

describe('OnboardingScreen', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockMarkDone.mockReset().mockResolvedValue(undefined);
    mockReadCurrency.mockReset().mockResolvedValue(null);
    mockWriteCurrency.mockReset().mockResolvedValue(undefined);
  });

  it('son adımda seçilen para birimini kaydeder', async () => {
    render(<OnboardingScreen />);
    fireEvent(screen.UNSAFE_getByType(FlatList), 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: Dimensions.get('window').width * 3 } } });
    fireEvent.press(screen.getByRole('radio', { name: 'Euro, EUR' }));
    fireEvent.press(screen.getByRole('button', { name: 'Başlayalım' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(mockWriteCurrency).toHaveBeenCalledWith('EUR');
  });

  it('kayıt hatasında tanıtımı tamamlamaz ve tekrar denemeye izin verir', async () => {
    mockWriteCurrency.mockRejectedValueOnce(new Error('storage unavailable'));
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Atla' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(mockMarkDone).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Atla' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('tanıtımı atlayınca varsayılan para birimini kaydedip tamamlandı işaretler ve girişe gider', async () => {
    render(<OnboardingScreen />);

    expect(screen.getByText('Aboneliklerin, tek yerde.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Atla' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(mockWriteCurrency).toHaveBeenCalledWith('TRY');
    expect(mockMarkDone).toHaveBeenCalledTimes(1);
    expect(mockWriteCurrency.mock.invocationCallOrder[0]).toBeLessThan(mockMarkDone.mock.invocationCallOrder[0]);
    expect(mockMarkDone.mock.invocationCallOrder[0]).toBeLessThan(mockReplace.mock.invocationCallOrder[0]);
  });
});
