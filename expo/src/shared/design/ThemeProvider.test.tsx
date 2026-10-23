import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import * as ReactNative from 'react-native';
import { readJsonStrict, writeJson } from '../../core/storage/secureJsonStore';
import { ThemeProvider, useThemePreference } from './ThemeProvider';
import { setEffectiveTheme, themeSnapshot } from './themeRuntime';
jest.mock('../../core/storage/secureJsonStore', () => ({ readJsonStrict: jest.fn(), writeJson: jest.fn() }));
function Probe() {
  const theme = useThemePreference();
  return <><Text>{`${theme.preference}|${theme.ready}|${theme.error}`}</Text><Pressable accessibilityRole="button" accessibilityLabel="Light" onPress={() => { void theme.setPreference('light').catch(() => undefined); }} /></>;
}
beforeEach(() => { jest.mocked(readJsonStrict).mockReset().mockResolvedValue(null); jest.mocked(writeJson).mockReset().mockResolvedValue(undefined); setEffectiveTheme('dark'); });
it('new default is system and explicit preference is persisted before changing', async () => {
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByText('system|true|')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Light' }));
  await waitFor(() => expect(screen.getByText('light|true|')).toBeTruthy());
  expect(writeJson).toHaveBeenCalledWith('appearance.theme', 'light');
});
it('preserves dark on existing installation and preserves it when storage rejects', async () => {
  jest.mocked(readJsonStrict).mockImplementation(async (key) => key === 'onboarding.done' ? true : null);
  jest.mocked(writeJson).mockRejectedValue(new Error('locked keystore'));
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByText('dark|true|')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Light' }));
  await waitFor(() => expect(writeJson).toHaveBeenCalled());
  expect(screen.getByText('dark|true|')).toBeTruthy();
});
it('does not overwrite corrupted stored preferences', async () => {
  jest.mocked(readJsonStrict).mockResolvedValue({ invalid: true });
  render(<ThemeProvider><Probe /></ThemeProvider>);
  await waitFor(() => expect(screen.getByText(/Tema tercihi okunamadı/)).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Light' }));
  expect(writeJson).not.toHaveBeenCalled();
});
it('uses the system scheme before the stored preference is read', async () => {
  const scheme = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  jest.mocked(readJsonStrict).mockImplementation(() => new Promise(() => undefined));
  setEffectiveTheme('dark');
  render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('system|false|')).toBeTruthy();
  expect(themeSnapshot()).toBe('light');
  scheme.mockRestore();
});
