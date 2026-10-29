import type { TextStyle } from 'react-native';

import { colors } from './tokens';
import { themedStyles } from './themeRuntime';
import { fontFamilies, type FontWeightName } from './fonts';

/**
 * Yazı tipi ailesi. Hanken Grotesk statik ağırlıkları pakete gömülüdür; çalışma zamanında
 * indirilmez (güvenlik denetimi F-19). Yükleme `app/_layout.tsx` içinde.
 */
export const fontFamily = fontFamilies[400];

/** Ağırlığa karşılık gelen aile adı (`fontWeight` yazılmaz). */
export function fontFor(weight: FontWeightName): string {
  return fontFamilies[weight];
}

/**
 * Yazı rolleri ([DESIGN_SYSTEM.md](../../../../docs/expo/DESIGN_SYSTEM.md)). Ekranlar boyut ya da
 * ağırlık yazmaz, rol seçer. En küçük boyut 12'dir. Renkler varsayılan olarak `onSurface`'tır.
 */
type CoreStyle = {
  size: number;
  weight: FontWeightName;
  color: 'onSurface' | 'onSurfaceVariant';
  letterSpacing?: number;
  tabular?: boolean;
};

const CORE = {
  display: { size: 36, weight: 700, color: 'onSurface', letterSpacing: -0.5, tabular: true },
  financialHero: { size: 44, weight: 700, color: 'onSurface', letterSpacing: -0.5, tabular: true },
  headline: { size: 28, weight: 700, color: 'onSurface' },
  title: { size: 22, weight: 700, color: 'onSurface' },
  heading: { size: 18, weight: 600, color: 'onSurface' },
  body: { size: 16, weight: 400, color: 'onSurface' },
  bodyStrong: { size: 16, weight: 600, color: 'onSurface' },
  bodySmall: { size: 14, weight: 400, color: 'onSurface' },
  label: { size: 14, weight: 600, color: 'onSurface' },
  caption: { size: 12, weight: 500, color: 'onSurfaceVariant' },
  captionStrong: { size: 12, weight: 700, color: 'onSurface' },
  overline: { size: 12, weight: 700, color: 'onSurfaceVariant', letterSpacing: 1 },
  numeric: { size: 16, weight: 700, color: 'onSurface', tabular: true },
} as const satisfies Record<string, CoreStyle>;

export type CoreTypeRole = keyof typeof CORE;

const scale = themedStyles(() => {
  const out: Record<string, TextStyle> = {};
  for (const name of Object.keys(CORE) as CoreTypeRole[]) {
    const core: CoreStyle = CORE[name];
    out[name] = {
      fontFamily: fontFor(core.weight),
      fontSize: core.size,
      color: colors[core.color],
      ...(core.letterSpacing === undefined ? {} : { letterSpacing: core.letterSpacing }),
      ...(core.tabular ? { fontVariant: ['tabular-nums'] } : {}),
    };
  }
  return out;
});

export type TypeRole = CoreTypeRole;

/** Bir rolün tam `TextStyle` değeri (aile dahil). */
export function textStyle(role: TypeRole, overrides: TextStyle = {}): TextStyle {
  return { ...scale[role], ...overrides };
}

/** Düğme yazısı: `bodyStrong` boyutu, renk çağıran tarafından verilir. */
export const buttonText: TextStyle = { fontFamily: fontFor(600), fontSize: 16 };

/** Bağlantı yazısı: `label` rolü, primary renk. */
export const textButtonText: TextStyle = themedStyles(() => ({
  fontFamily: fontFor(600),
  fontSize: 14,
  color: colors.primary,
}));

/** Kod örneği yazısı (monospace 12). */
export const codeText: TextStyle = themedStyles(() => ({ fontFamily: 'monospace', fontSize: 12, color: colors.onSurface }));
