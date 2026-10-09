import type { TextStyle } from 'react-native';

import { colors } from './tokens';

/**
 * Yazı tipi ailesi. Hanken Grotesk (SIL OFL 1.1) pakete gömülüdür; çalışma
 * zamanında indirilmez (güvenlik denetimi F-19). Yükleme `app/_layout.tsx` içinde.
 */
export const fontFamily = 'HankenGrotesk';

/**
 * Yazı rolleri ([DESIGN_SYSTEM.md §5](../../../../docs/expo/DESIGN_SYSTEM.md)). Ekranlar
 * boyut ya da kalınlık yazmaz, rol seçer. Renkler varsayılan olarak `onSurface`'tır.
 */
type TypeToken = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'color' | 'letterSpacing'>;

const scale = {
  display: { fontSize: 36, fontWeight: '700', color: colors.onSurface },
  headline: { fontSize: 28, fontWeight: '700', color: colors.onSurface },
  title: { fontSize: 22, fontWeight: '700', color: colors.onSurface },
  titleSmall: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  body: { fontSize: 16, fontWeight: '400', color: colors.onSurface },
  bodySmall: { fontSize: 14, fontWeight: '400', color: colors.onSurface },
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  caption: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
} satisfies Record<string, TypeToken>;

export type TypeRole = keyof typeof scale;

/** Bir rolün tam `TextStyle` değeri (fontFamily dahil). */
export function textStyle(role: TypeRole, overrides: TextStyle = {}): TextStyle {
  return { fontFamily, ...scale[role], ...overrides };
}

/** Düğme yazısı: `label` rolü. */
export const buttonText: TextStyle = { fontFamily, fontSize: 14, fontWeight: '600' };

/** Bağlantı yazısı: `label` rolü, primary renk. */
export const textButtonText: TextStyle = {
  fontFamily,
  fontSize: 14,
  fontWeight: '600',
  color: colors.primary,
};
