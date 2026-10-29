import { fireEvent, render, screen } from '@testing-library/react-native';
import { civilDate } from '../../core/time/calendar';
import { DateField } from './DateField';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return function MockDatePicker() { return React.createElement(View, { testID: 'date-picker' }); };
});

it('seçili tarihi ve varsa doğrulama hatasını düğmeye bağlar', () => {
  const view = render(<DateField label="Sonraki ödeme" value={null} fallback={civilDate(2026, 10, 1)} error="Tarih seç." onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Sonraki ödeme: seçilmedi' }).props.accessibilityHint).toBe('Hata: Tarih seç.');
  expect(screen.getByText('Tarih seç.').props.accessibilityLiveRegion).toBe('polite');
  view.rerender(<DateField label="Sonraki ödeme" value={civilDate(2026, 10, 1)} fallback={civilDate(2026, 10, 1)} onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: /Sonraki ödeme: 1 Ekim 2026/ }).props.accessibilityHint).toBeUndefined();
});

it('devre dışı tarihin seçicisini açmaz', () => {
  render(<DateField label="Tarih" value={null} fallback={civilDate(2026, 10, 1)} disabled onChange={jest.fn()} />);
  const button = screen.getByRole('button', { name: 'Tarih: seçilmedi' });
  expect(button.props.accessibilityState.disabled).toBe(true);
  fireEvent.press(button);
  expect(screen.queryByTestId('date-picker')).toBeNull();
});
