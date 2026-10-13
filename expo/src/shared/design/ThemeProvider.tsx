import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { decodeThemePreference, resolveTheme, type ThemePreference } from '../../core/domain/themePreference';
import { readJsonStrict, writeJson } from '../../core/storage/secureJsonStore';
import { setEffectiveTheme } from './themeRuntime';
import { useThemeRevision } from './useThemeRevision';

const KEY = 'appearance.theme';
const ThemeContext = createContext({ preference: 'system' as ThemePreference, ready: false, error: '', setPreference: async (_value: ThemePreference) => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, update] = useState<ThemePreference>('system'); // Kayıtlı tercih okunana kadar sistem şeması geçerlidir.
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const writable = useRef(false);
  useEffect(() => {
    let mounted = true;
    void Promise.all([readJsonStrict(KEY), readJsonStrict('onboarding.done')]).then(([value, existing]) => {
      const next = decodeThemePreference(value, existing === true);
      if (mounted) { writable.current = true; update(next); setReady(true); }
    }).catch(() => { if (mounted) { setError('Tema tercihi okunamadı. Kayıt korunuyor; uygulamayı yeniden aç.'); setReady(true); } });
    return () => { mounted = false; };
  }, []);
  // Boyamadan önce uygulanır: kayıt okunana kadar sistem şeması kullanılır ('dark' sabiti değil).
  useLayoutEffect(() => { setEffectiveTheme(resolveTheme(preference, system)); }, [preference, system]);
  async function setPreference(next: ThemePreference) {
    if (!writable.current) throw new Error(error || 'Tema tercihi henüz yüklenmedi.');
    await writeJson(KEY, next);
    update(next);
    setEffectiveTheme(resolveTheme(next, system));
  }
  useThemeRevision();
  return <ThemeContext.Provider value={{ preference, ready, error, setPreference }}>{children}</ThemeContext.Provider>;
}
export const useThemePreference = () => useContext(ThemeContext);
