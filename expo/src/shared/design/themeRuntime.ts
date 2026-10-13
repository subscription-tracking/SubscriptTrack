import { darkColors, lightColors, darkStatusColors, lightStatusColors, type ThemeColors } from './themePalette';

export type EffectiveTheme = 'light' | 'dark';
let theme: EffectiveTheme = 'dark';
const listeners = new Set<() => void>();
export const themeSnapshot = () => theme;
export function subscribeTheme(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setEffectiveTheme(next: EffectiveTheme) {
  if (theme === next) return;
  theme = next;
  listeners.forEach((listener) => listener());
}
export const colors: ThemeColors = new Proxy(darkColors as ThemeColors, {
  get: (_target, key: keyof ThemeColors) => (theme === 'light' ? lightColors : darkColors)[key],
});
export const statusColors: { [K in keyof typeof darkStatusColors]: string } = new Proxy(darkStatusColors, {
  get: (_target, key: keyof typeof darkStatusColors) => (theme === 'light' ? lightStatusColors : darkStatusColors)[key],
});

/** Lazy styles retain existing token names and regenerate once per effective palette. */
export function themedStyles<T extends object>(factory: () => T): T {
  const cache = new Map<EffectiveTheme, T>();
  function current() {
    let value = cache.get(theme);
    if (!value) { value = factory(); cache.set(theme, value); }
    return value;
  }
  // Hermes, proxy ownKeys/getOwnPropertyDescriptor sonuçlarını hedef nesneyle tutarlı ister; hedef her çağrıda güncel stille eşlenir.
  function mirror(target: T) {
    const value = current();
    for (const key of Reflect.ownKeys(value)) {
      Object.defineProperty(target, key, { value: Reflect.get(value, key), writable: true, enumerable: true, configurable: true });
    }
  }
  return new Proxy({} as T, {
    get: (_target, key) => Reflect.get(current(), key),
    ownKeys: (target) => { mirror(target); return Reflect.ownKeys(target); },
    getOwnPropertyDescriptor: (target, key) => { mirror(target); return Reflect.getOwnPropertyDescriptor(target, key); },
  });
}
