import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TopBar } from './TopBar';
import { sizes } from '../design/tokens';

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }));

it('ana sayfada tek marka başlığı ve gerçek okunmamış sayısıyla tek bildirim eylemi sunar', () => {
  const onNotifications = jest.fn();
  render(<TopBar variant="home" icon="home-outline" title="SubscriptTrack" subtitle="29 Ekim Perşembe" unreadCount={3} onCalendar={jest.fn()} onNotifications={onNotifications} />);
  expect(screen.getAllByRole('header')).toHaveLength(1);
  expect(screen.getByText('29 Ekim Perşembe')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Takvim' })).toBeNull();
  const button = screen.getByRole('button', { name: 'Bildirimler, 3 okunmamış' });
  expect(button.props.style.width).toBeGreaterThanOrEqual(sizes.minTouchTarget);
  fireEvent.press(button);
  expect(onNotifications).toHaveBeenCalledTimes(1);
});

it('bölüm başlığı yalnızca istenen eylemi gösterir', () => {
  render(<TopBar icon="grid" title="Abonelikler" showCalendar onCalendar={jest.fn()} onNotifications={jest.fn()} />);
  expect(screen.getByText('Abonelikler')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Takvim' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Bildirimler' })).toBeNull();
});

it('alt açıklaması olmayan bölümde aynı ikinci satır alanını görünmez tutar', () => {
  render(<TopBar icon="bar-chart" title="İstatistikler" onCalendar={jest.fn()} onNotifications={jest.fn()} />);
  const title = screen.getByRole('header', { name: 'İstatistikler' });
  expect(title).toBeTruthy();
  expect(screen.UNSAFE_getAllByType(Text).some((node) => node.props.accessibilityElementsHidden === true)).toBe(true);
});
