export type ThemePreference = 'light' | 'dark' | 'system';
export function decodeThemePreference(value: unknown, existingInstallation: boolean): ThemePreference {
  if (value === null) return existingInstallation ? 'dark' : 'system';
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  throw new Error('Tema tercihi okunamadı. Kayıt korunuyor.');
}
export function resolveTheme(preference: ThemePreference, system: 'light' | 'dark' | 'unspecified' | null | undefined) {
  return preference === 'system' ? system === 'dark' ? 'dark' : 'light' : preference;
}
