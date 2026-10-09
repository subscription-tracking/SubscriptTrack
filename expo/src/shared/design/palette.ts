
/** Tanıtım sayfalarının vurgu ve arka plan renkleri (Flutter `OnboardingScreen`). */
export const onboardingColors = {
  indigo: '#7377F5',
  indigoWash: '#0C0E2A',
  green: '#16A36A',
  greenWash: '#071510',
  amber: '#F5A524',
  amberWash: '#1A1100',
  /** Flutter `Colors.black12` gölgesi (para birimi çipi). */
  chipShadow: '#000000',
} as const;

/** Kategori dilimleri sırayla (Flutter `CategoryBreakdownCard._palette`). */
export const chartColors = {
  chart0: '#8B82F6',
  chart1: '#10B981',
  chart2: '#3B82F6',
  chart3: '#F59E0B',
  chart4: '#EC4899',
  chart5: '#06B6D4',
  chart6: '#84CC16',
  /** Azalış rengi (Flutter `_decreaseColor`). */
  decrease: '#76B995',
  /** Uyarı şeridi ve yeşil eylem ikonu (Flutter istatistik sabitleri). */
  amber: '#F59E0B',
  emerald: '#10B981',
} as const;

export const chartPalette: readonly string[] = [
  chartColors.chart0,
  chartColors.chart1,
  chartColors.chart2,
  chartColors.chart3,
  chartColors.chart4,
  chartColors.chart5,
  chartColors.chart6,
];
