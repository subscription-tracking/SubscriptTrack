import { decodeThemePreference, resolveTheme } from './themePreference';
it('defaults new installations to system and keeps existing dark appearance', () => {
  expect(decodeThemePreference(null, false)).toBe('system');
  expect(decodeThemePreference(null, true)).toBe('dark');
  expect(decodeThemePreference('light', true)).toBe('light');
});
it('rejects corrupted preference and resolves unspecified system to light', () => {
  expect(() => decodeThemePreference({}, false)).toThrow();
  expect(resolveTheme('system', 'dark')).toBe('dark');
  expect(resolveTheme('system', 'unspecified')).toBe('light');
  expect(resolveTheme('dark', 'light')).toBe('dark');
});
