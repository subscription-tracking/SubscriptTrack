import { darkCategoryPalette, darkChartColors, lightCategoryPalette, lightChartColors } from './palette';
import { themeSnapshot } from './themeRuntime';

/**
 * Etkin temaya göre grafik renkleri. Ham değerler saf `palette.ts` içindedir (domain katmanı onu
 * import edebilir); tema çözümü burada, sunum katmanında yapılır.
 */
export const chartColors: { [K in keyof typeof darkChartColors]: string } = new Proxy(darkChartColors, {
  get: (_target, key: keyof typeof darkChartColors) => (themeSnapshot() === 'light' ? lightChartColors : darkChartColors)[key],
});

/** Etkin temaya göre kategori renkleri (10 kategori, `SUBSCRIPTION_CATEGORIES` sırası). */
export function categoryPalette(): readonly string[] {
  return themeSnapshot() === 'light' ? lightCategoryPalette : darkCategoryPalette;
}

/** Grafik dilimleri için sıralı palet. */
export function chartPalette(): readonly string[] {
  const c = chartColors;
  return [c.chart0, c.chart1, c.chart2, c.chart3, c.chart4, c.chart5, c.chart6];
}
