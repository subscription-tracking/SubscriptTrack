
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

/** Kategori dilimleri sırayla (koyu tema; açık tema için `lightChartColors`). */
export const darkChartColors = {
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

/** Açık tema: beyaz yüzeye karşı her renk ≥3:1 (grafik ve ikon, WCAG 1.4.11). */
export const lightChartColors = {
  chart0: '#6C63E0',
  chart1: '#0B8A60',
  chart2: '#2F6FE0',
  chart3: '#B77400',
  chart4: '#D63384',
  chart5: '#0A7F95',
  chart6: '#5B8A00',
  decrease: '#2F7044',
  amber: '#B77400',
  emerald: '#0B8A60',
} as const;

/**
 * Kategori başına sabit renkler (10 kategori, sıra `SUBSCRIPTION_CATEGORIES` ile aynıdır). Sıralamaya ya da
 * listedeki konuma bağlı değildir; aynı kategori her ekranda aynı rengi alır.
 */
export const darkCategoryPalette: readonly string[] = [
  '#8B82F6',
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#A855F7',
  '#94A3B8',
];

export const lightCategoryPalette: readonly string[] = [
  '#6C63E0',
  '#0B8A60',
  '#2F6FE0',
  '#B77400',
  '#D63384',
  '#0A7F95',
  '#5B8A00',
  '#C85A0A',
  '#8A3FD6',
  '#64748B',
];
