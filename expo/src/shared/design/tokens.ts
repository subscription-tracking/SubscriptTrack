/**
 * Tasarım tokenları. Flutter sürümündeki `app_colors.dart` ve `app_tokens.dart`
 * değerlerinin birebir karşılığıdır; ekranlar değerleri buradan okur, kendi
 * boşluk, köşe ve buton yüksekliklerini uydurmaz ([DESIGN_SYSTEM.md](../../../../docs/product/DESIGN_SYSTEM.md)).
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
} as const;

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
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** Ekran kenar boşluğu: Flutter `AppSpacing.screen` (yatay 20). */
export const screenGutter = spacing.lg;

export const radius = {
  small: 14,
  medium: 20,
  large: 24,
  pill: 100,
} as const;

export const sizes = {
  minTouchTarget: 48,
  primaryButtonHeight: 50,
  /** Alt gezinmenin içerik yüksekliği (güvenli alan hariç). */
  bottomNavHeight: 64,
  topBarHeight: 88,
} as const;

export type ColorToken = keyof typeof colors;
export type StatusColorToken = keyof typeof statusColors;
