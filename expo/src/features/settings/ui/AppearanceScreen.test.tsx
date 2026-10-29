import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppearanceScreen } from './AppearanceScreen';

const mockSetCurrency = jest.fn();
const mockSetTimeZone = jest.fn();
const mockSnackbar = jest.fn();

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('../../../shared/widgets/AppSnackbar', () => ({ useSnackbar: () => ({ show: mockSnackbar }) }));
jest.mock('../data/useActiveCurrency', () => ({
  useActiveCurrency: () => 'TRY',
  useUserTimeZone: () => 'Europe/Istanbul',
  useUserTimeZoneState: () => ({ mode: 'fixed' }),
  useSetTimeZoneMode: () => ({ mutate: jest.fn(), isPending: false }),
  useSetActiveCurrency: () => ({ mutate: mockSetCurrency }),
  useSetUserTimeZone: () => ({ mutate: mockSetTimeZone, isPending: false }),
}));

describe('AppearanceScreen', () => {
  beforeEach(() => {
    mockSetCurrency.mockReset();
    mockSetTimeZone.mockReset();
    mockSnackbar.mockReset();
  });

  it('seçili para birimini erişilebilir işaretler ve farklı seçimde tercihi günceller', () => {
    render(<AppearanceScreen />);

    expect(screen.getByRole('radio', { name: 'Türk Lirası (TRY)', checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'ABD Doları (USD)', checked: false })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'ABD Doları (USD)' }));

    expect(mockSetCurrency).toHaveBeenCalledWith('USD');
  });

  it('IANA saat dilimi seçicisini açar ve seçimi kaydetme mutasyonuna iletir', () => {
    render(<AppearanceScreen />);

    const toggle = screen.getByRole('button', { name: 'Saat dilimi seç, mevcut Europe/Istanbul' });
    expect(toggle.props.accessibilityState.expanded).toBe(false);
    fireEvent.press(toggle);
    expect(screen.getByRole('button', { name: 'Saat dilimi seç, mevcut Europe/Istanbul' }).props.accessibilityState.expanded).toBe(true);
    expect(screen.getByRole('radio', { name: 'Türkiye (Europe/Istanbul)', checked: true })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'New York (America/New_York)' }));

    expect(mockSetTimeZone).toHaveBeenCalledWith('America/New_York', expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }));
  });
});
