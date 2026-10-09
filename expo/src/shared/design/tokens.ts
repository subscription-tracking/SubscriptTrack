/**
 * Tasarım tokenları. Flutter sürümündeki `app_colors.dart`, `app_tokens.dart` ve
 * `app_theme.dart` değerlerinin birebir karşılığıdır. Ekranlar değerleri buradan
 * okur; kendi boşluk, köşe, yazı ve buton ölçülerini uydurmaz
 * ([DESIGN_SYSTEM.md](../../../../docs/product/DESIGN_SYSTEM.md)).
 *
 * Yalnızca koyu tema vardır ([CURRENT_STATUS](../../../../docs/CURRENT_STATUS.md): açık tema planlı).
 */

export const colors = {
  background: '#101217',
  surface: '#181B22',
  surfaceHigh: '#20242D',
  border: '#2B303B',
  primary: '#8B8CF7',
  onPrimary: '#171824',
  secondary: '#B5B6FF',
  tertiary: '#D6A15A',
  onBackground: '#F2F4F7',
  onSurface: '#F2F4F7',
  onSurfaceVariant: '#AAB1C0',
  error: '#D77979',
  outline: '#4C5361',
  /** Flutter `AmbientBackground` varsayılan yıkama rengi. */
  ambientWash: '#0C0E2A',
  /** Flutter ColorScheme.inverseSurface / onInverseSurface (snackbar varsayılanı). */
  inverseSurface: '#F2F4F7',
  onInverseSurface: '#101217',
  white: '#FFFFFF',
} as const;

/** Metin ve yüzey opaklıkları. Ekranlar ham rgba yazmaz; bu değerleri `withAlpha` ile uygular. */
export const opacity = {
  /** Yardımcı metin (marka satırı gibi). */
  muted: 0.55,
  /** Devre dışı metin (Flutter onSurface %38). */
  disabled: 0.38,
  /** Devre dışı dolgu (Flutter onSurface %12). */
  disabledContainer: 0.12,
} as const;

/** Onaltılık renge alfa uygular: `withAlpha('#F2F4F7', 0.5)` → `rgba(242, 244, 247, 0.5)`. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Durum renkleri yalnızca durum bildirir; marka rengi durum için kullanılmaz.
 * Flutter'daki `AppStatusColors` ile aynıdır.
 */
export const statusColors = {
  success: '#78A987',
  warning: '#D6A15A',
  trial: '#9B9BD8',
  muted: '#737B8C',
} as const;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

/** Ekran kenar boşluğu (yatay). Tasarım kuralı §4: auth ve uygulama ekranlarında aynı, 20. */
export const screenGutter = spacing.lg;

export const radius = {
  xs: 4,
  small: 14,
  medium: 20,
  large: 24,
  pill: 100,
} as const;

/** Flutter `OutlineInputBorder`/`BorderSide(width: 0.5)` ve `1.5` kalınlıkları. */
export const borderWidth = {
  hairline: 0.5,
  focused: 1.5,
} as const;

export const sizes = {
  avatar: 42,
  avatarLarge: 72,
  minTouchTarget: 48,
  /** Flutter `FilledButton` tema minimumu (`Size.fromHeight(50)`). */
  primaryButtonHeight: 50,
  /** Flutter `LoadingFilledButton` (tall) yüksekliği. */
  tallButtonHeight: 52,
  /** Flutter `GlowOrb` varsayılan çapı. */
  glowOrbSize: 88,
  /** Alt gezinmenin içerik yüksekliği (güvenli alan hariç). */
  bottomNavHeight: 64,
  topBarHeight: 88,
} as const;

export type ColorToken = keyof typeof colors;
export type StatusColorToken = keyof typeof statusColors;
