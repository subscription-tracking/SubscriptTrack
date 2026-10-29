import { fireEvent, render, screen } from '@testing-library/react-native';

import { PrivacyCenterScreen } from './PrivacyCenterScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));

describe('PrivacyCenterScreen', () => {
  beforeEach(() => mockPush.mockReset());

  it('veri kontrolü açıklamasını ve gizlilik/veri yönetimi seçeneklerini gösterir', () => {
    render(<PrivacyCenterScreen />);

    expect(screen.getByText('Verilerin kontrolü sende')).toBeTruthy();
    expect(screen.getByText('Aboneliklerin ve tasarruf kayıtların hesabınla ilişkilidir. Verilerini buradan yönetebilirsin.')).toBeTruthy();
    expect(screen.getByText('Bu işlem geri alınamaz')).toBeTruthy();
  });

  it('yasal, dışa aktarma ve hesap silme rotalarına yönlendirir', () => {
    render(<PrivacyCenterScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Gizlilik politikası' }));
    expect(mockPush).toHaveBeenLastCalledWith('/legal/privacy');

    fireEvent.press(screen.getByRole('button', { name: 'Kullanım şartları' }));
    expect(mockPush).toHaveBeenLastCalledWith('/legal/terms');

    fireEvent.press(screen.getByRole('button', { name: 'Verilerimi dışa aktar' }));
    expect(mockPush).toHaveBeenLastCalledWith('/settings/export');

    fireEvent.press(screen.getByRole('button', { name: 'Hesabımı ve verilerimi sil' }));
    expect(mockPush).toHaveBeenLastCalledWith('/settings/delete-account');
  });
});
