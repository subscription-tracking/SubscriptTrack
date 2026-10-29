import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { AnimatedMoney } from './AnimatedMoney';
import { PrimaryButton } from './PrimaryButton';
import { TonalButton } from './TonalButton';
import { sizes } from '../design/tokens';

jest.mock('@expo/vector-icons/MaterialIcons', () => 'MaterialIcons');

it('yüklenen birincil düğme adını ve meşgul durumunu korur', () => {
  const press = jest.fn();
  const view = render(<PrimaryButton label="Kaydet" onPress={press} loading />);
  const button = screen.getByRole('button', { name: 'Kaydet' });
  expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  fireEvent.press(button);
  expect(press).not.toHaveBeenCalled();
  view.rerender(<PrimaryButton label="Kaydet" onPress={press} />);
  fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(press).toHaveBeenCalledTimes(1);
});

it('ikincil düğme özel yükseklikte de minimum dokunma alanını korur', () => {
  render(<TonalButton label="Dene" onPress={jest.fn()} minHeight={10} />);
  expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Dene' }).props.style).minHeight).toBeGreaterThanOrEqual(sizes.minTouchTarget);
});

it('hareket azaltma açıkken para tutarını doğrudan gösterir', async () => {
  const spy = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  render(<AnimatedMoney amount={123} currency="TRY" />);
  await act(async () => {});
  expect(screen.getByText(/123/)).toBeTruthy();
  spy.mockRestore();
});
