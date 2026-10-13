import { darkColors, lightColors, darkStatusColors, lightStatusColors, type ThemeColors } from './themePalette';
import { categoryPalette, chartColors } from './chartTheme';
import { setEffectiveTheme } from './themeRuntime';

/** WCAG 2.x göreli parlaklık ve kontrast oranı. */
function luminance(hex: string): number {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function ratio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const themes: { name: string; colors: ThemeColors; status: Record<keyof typeof darkStatusColors, string> }[] = [
  { name: 'koyu', colors: darkColors, status: darkStatusColors },
  { name: 'açık', colors: lightColors, status: lightStatusColors },
];

describe.each(themes)('kontrast ($name tema)', ({ colors, status }) => {
  const surfaces = [colors.background, colors.surface, colors.surfaceHigh] as const;

  it('gövde ve ikincil metin yüzeylerde en az 4,5:1', () => {
    for (const surface of surfaces) {
      expect(ratio(colors.onSurface, surface)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(colors.onSurfaceVariant, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('birincil, hata ve durum metinleri zeminlerde en az 4,5:1', () => {
    for (const surface of [colors.background, colors.surface]) {
      expect(ratio(colors.primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(colors.error, surface)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(status.success, surface)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(status.warning, surface)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(status.mutedText, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('düğme ve konteyner metinleri kendi zeminlerinde en az 4,5:1', () => {
    expect(ratio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(colors.onPrimaryContainer, colors.primaryContainer)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(colors.onErrorContainer, colors.errorContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it('etkileşimli bileşen sınırı yüzeylere karşı en az 3:1 (WCAG 1.4.11)', () => {
    for (const surface of surfaces) {
      expect(ratio(colors.controlBorder, surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it('pasif yüzey etkin yüzeyden ayrışır', () => {
    expect(colors.disabledSurface).not.toBe(colors.surface);
    expect(colors.disabledText).not.toBe(colors.onSurface);
  });
});

describe('grafik renkleri en az 3:1', () => {
  it.each([
    ['koyu', 'dark', darkColors.surface],
    ['açık', 'light', lightColors.surface],
  ] as const)('%s tema', (_name, theme, surface) => {
    setEffectiveTheme(theme);
    try {
      const values = [chartColors.chart0, chartColors.chart1, chartColors.chart2, chartColors.chart3, chartColors.chart4,
        chartColors.chart5, chartColors.chart6, chartColors.amber, chartColors.emerald, ...categoryPalette()];
      for (const value of values) expect(ratio(value, surface)).toBeGreaterThanOrEqual(3);
    } finally {
      setEffectiveTheme('dark');
    }
  });
});
