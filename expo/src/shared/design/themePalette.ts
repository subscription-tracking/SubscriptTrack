export const darkColors = {
  background: '#101217',
  surface: '#181B22',
  surfaceHigh: '#20242D',
  /** Flutter `surfaceContainerHighest` (ipucu ve analiz rozeti). */
  surfaceContainerHighest: '#252A33',
  /** Flutter `surfaceContainerLow` (alt sayfa zemini). */
  surfaceLow: '#151820',
  /** Flutter Material container renkleri (bildirim avatarları, kaydırma arka planı). */
  errorContainer: '#352124',
  onErrorContainer: '#F0B4B4',
  tertiaryContainer: '#2B261E',
  /** Flutter `primaryContainer` / `onPrimaryContainer` (tasarruf özet kartı). */
  primaryContainer: '#252746',
  onPrimaryContainer: '#C7C8FF',
  /** Flutter `outline` %50 (form bölüm ve satır kenarlıkları). */
  outlineHalf: 'rgba(76, 83, 97, 0.5)',
  /** Flutter `secondaryContainer` (ekle düğmesi dolgusu). */
  secondaryContainer: '#252834',
  border: '#2B303B',
  /** Etkileşimli bileşen sınırı (alan, çerçeveli düğme, çip, onay kutusu): bileşen sınırı kontrastı ≥3:1 (WCAG 1.4.11). Kart ve ayırıcılar için `border` kalır. */
  controlBorder: '#6B7385',
  /** Pasif düğme/alan yüzeyi ve metni: yalnızca opaklıkla değil, açıkça farklı. */
  disabledSurface: '#20242D',
  disabledText: '#6F7686',
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
  /** Modal arka plan karartması (Flutter barrier ). */
  scrim: '#000000',
  /** Detay hero'su logo kutusu zemini (Flutter #0D1017). */
  logoTile: '#0D1017',
} as const;
export type ThemeColors = { [K in keyof typeof darkColors]: string };
export const lightColors: ThemeColors = {
  ...darkColors, background: '#F8F9FC', surface: '#FFFFFF', surfaceHigh: '#EEF0F6',
  surfaceContainerHighest: '#E6E9F1', surfaceLow: '#F3F5FA', errorContainer: '#FFE9E8',
  onErrorContainer: '#822F2F', tertiaryContainer: '#FFF0DC', primaryContainer: '#E7E7FF',
  onPrimaryContainer: '#343487', outlineHalf: 'rgba(111, 118, 136, 0.5)', secondaryContainer: '#E9EBF6',
  border: '#D4D8E3', controlBorder: '#7A849A', disabledSurface: '#E6E9F1', disabledText: '#8A92A3', primary: '#5153C5', onPrimary: '#FFFFFF', secondary: '#50529F',
  tertiary: '#825715', onBackground: '#202431', onSurface: '#202431', onSurfaceVariant: '#525D72',
  error: '#AC3636', outline: '#6F7688', ambientWash: '#E8E9FF', inverseSurface: '#202431',
  onInverseSurface: '#F8F9FC', logoTile: '#E5E8F1',
};

export const darkStatusColors = {
  success: '#78A987',
  warning: '#D6A15A',
  trial: '#9B9BD8',
  muted: '#737B8C',
  /** Metin için açık "muted" (zemin üzerinde ≥4.5:1). Flutter `muted` değerinden sapma; yalnızca küçük metinde kullanılır. */
  mutedText: '#8A92A3',
} as const;
export const lightStatusColors = { success: '#2F7044', warning: '#805719', trial: '#5F5FAB', muted: '#5F687A', mutedText: '#586275' };
