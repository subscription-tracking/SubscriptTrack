import { act, render, screen } from '@testing-library/react-native';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from './tokens';
import { textStyle, textButtonText } from './typography';
import { setEffectiveTheme, themedStyles } from './themeRuntime';
import { useThemeRevision } from './useThemeRevision';
const styles = themedStyles(() => StyleSheet.create({ screen: { backgroundColor: colors.background } }));
function Probe() {
  useThemeRevision();
  return <View testID="surface" style={styles.screen}><Text style={textStyle('body')}>Body</Text><Text style={textButtonText}>Link</Text></View>;
}
afterEach(() => { act(() => setEffectiveTheme('dark')); });
it('updates module-level styles, inline tokens, and typography in both directions', () => {
  render(<Probe />);
  expect(StyleSheet.flatten(screen.getByTestId('surface').props.style).backgroundColor).toBe('#101217');
  act(() => setEffectiveTheme('light'));
  expect(StyleSheet.flatten(screen.getByTestId('surface').props.style).backgroundColor).toBe('#F8F9FC');
  expect(StyleSheet.flatten(screen.getByText('Body').props.style).color).toBe('#202431');
  expect(StyleSheet.flatten(screen.getByText('Link').props.style).color).toBe('#5153C5');
  act(() => setEffectiveTheme('dark'));
  expect(StyleSheet.flatten(screen.getByText('Body').props.style).color).toBe('#F2F4F7');
});
