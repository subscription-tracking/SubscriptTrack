import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScreenTopBar } from './ScreenTopBar';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

it('ekran adını başlık, geri eylemini düğme olarak sunar', () => {
  render(<ScreenTopBar title="Ödeme geçmişi" />);
  expect(screen.getByRole('header', { name: 'Ödeme geçmişi' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Geri' }));
  expect(mockBack).toHaveBeenCalled();
});
