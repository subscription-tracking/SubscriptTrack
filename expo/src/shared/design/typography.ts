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
  /** Flutter `AppBar` başlığı (üst bar satırı): titleMedium, w800. */
  topBarTitle: { fontSize: 16, fontWeight: '800', color: colors.onSurface },
  titleSmall: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  body: { fontSize: 16, fontWeight: '400', color: colors.onSurface },
  bodySmall: { fontSize: 14, fontWeight: '400', color: colors.onSurface },
  label: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  caption: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
  /** Flutter `labelSmall` (üst bar alt başlığı, alt gezinme etiketi): 11, w500. */
  labelSmall: { fontSize: 11, fontWeight: '500', color: colors.onSurfaceVariant },
  /** Aktif alt gezinme etiketi (Flutter `FontWeight.w700`). */
  labelSmallStrong: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant },
  /** Flutter `headlineSmall` (24, w700): şifre ekranlarının başlığı. */
  headlineSmall: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  /** Flutter `headlineSmall` + w800 (tanıtım başlıkları). */
  headlineSmallStrong: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  /** Para birimi sembolü (Flutter 18, w700). */
  symbolLarge: { fontSize: 18, fontWeight: '700', color: colors.onSurfaceVariant },
  /** Form bölüm etiketi (Flutter labelMedium 12, w600, harf aralığı 0.5). */
  formLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurface, letterSpacing: 0.5 },
  /** Popüler servis çipi yazısı (Flutter 13): normal ve kalın. */
  presetLabel: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant },
  presetLabelStrong: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  /** İstatistik: büyük harcama tutarı (Flutter displaySmall 36, ağırlık 800). */
  heroAmount: { fontSize: 36, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5 },
  /** Kart üst etiketi (Flutter labelSmall 11, w700, harf aralığı 1.2). */
  overline: { fontSize: 11, fontWeight: '700', color: colors.onSurfaceVariant, letterSpacing: 1.2 },
  /** Trend çubuk etiketi: normal, geçerli ay ve yoğun mod (9). */
  barLabel: { fontSize: 11, fontWeight: '500', color: colors.onSurfaceVariant },
  barLabelStrong: { fontSize: 11, fontWeight: '800', color: colors.primary },
  barLabelDense: { fontSize: 9, fontWeight: '500', color: colors.onSurfaceVariant, letterSpacing: -0.3 },
  /** Kart üstü rozet yazısı (Flutter labelSmall w700). */
  badge: { fontSize: 11, fontWeight: '700', color: colors.onSurface },
  /** Kart başlığı (Flutter titleMedium 16, w700). */
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  /** Profil avatarı baş harfi (Flutter 32, kalın). */
  avatarInitial: { fontSize: 32, fontWeight: '700', color: colors.onSurface },
  /** Ayarlar bölüm etiketi (Flutter 13, w600, harf aralığı 0.2) ve satır etiketi (14, w500). */
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant, letterSpacing: 0.2 },
  tileLabel: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
    /** Auth ekranı başlığı (Flutter `headlineMedium` + w800). */
  headlineStrong: { fontSize: 28, fontWeight: '800', color: colors.onSurface },
  /** Marka satırı (Flutter `BrandMark`): 14, w700. */
  brand: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  /** Düğme yazısı (Flutter `FilledButton`/`OutlinedButton` teması): 15, w600. */
  button: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
  /** Ana sayfa toplam tutarı (Flutter `headlineLarge` 36, w800). */
  amountLarge: { fontSize: 36, fontWeight: '800', color: colors.onSurface },
  /** Bölüm başlığı (Flutter `titleMedium` 20, w700). */
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  /** Halka/donut merkez değeri (14 veya 15, w800). */
  ringValue: { fontSize: 14, fontWeight: '800', color: colors.onSurface },
  donutTotal: { fontSize: 12, fontWeight: '800', color: colors.onSurface },
  /** Halka/donut alt etiketi (9.5 ya da 10, w600, yardımcı renk). */
  ringLabel: { fontSize: 9.5, fontWeight: '600', color: colors.onSurfaceVariant },
  donutLabel: { fontSize: 10, fontWeight: '600', color: colors.onSurfaceVariant },
  /** Kısa gövde metni (Flutter `bodySmall` 14 w600). */
  bodySmallStrong: { fontSize: 14, fontWeight: '600', color: colors.onSurface },
  /** Çip ve ikon-etiket yazısı (Flutter 11 px). */
  chip: { fontSize: 11, fontWeight: '400', color: colors.onSurface },
  chipStrong: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  /** Gövde metni (Flutter 12). */
  caption12: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
  /** Kart adı (Flutter `bodyLarge` 16, w700). */
  bodyLargeStrong: { fontSize: 16, fontWeight: '700', color: colors.onSurface },
  /** İpucu vurgusu (Flutter 12, w700). */
  caption12Strong: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  /** Gövde metni kalın (Flutter 14, w700): tasarruf tutarı. */
  bodyMediumStrong: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  /** Sekme hapı yazısı (Flutter 13): seçili kalın, değilse normal. */
  pill: { fontSize: 13, fontWeight: '500', color: colors.onSurfaceVariant },
  pillStrong: { fontSize: 13, fontWeight: '700', color: colors.onPrimary },
  /** Filtre çipi yazısı (Flutter 12): seçili kalın primary, değilse normal. */
  filterChip: { fontSize: 12, fontWeight: '400', color: colors.onSurfaceVariant },
  filterChipStrong: { fontSize: 12, fontWeight: '700', color: colors.primary },
  /** Detay ekranı: tarih (19, w800), gün sayısı (24, w800), gün etiketi (9, w800), bölüm başlığı (10, w700). */
  detailDate: { fontSize: 19, fontWeight: '800', color: colors.onSurface },
  dayCount: { fontSize: 24, fontWeight: '800', color: colors.onSurface },
  dayCaption: { fontSize: 9, fontWeight: '800', color: colors.onSurface },
  caption10Strong: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant },
  /** Tehlikeli düğme yazısı (Flutter 15, w700). */
  buttonStrong: { fontSize: 15, fontWeight: '700', color: colors.error },
  /** Kompakt bağlantı (Flutter TextButton 13, w700 primary). */
  compactLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  /** Hero başlığı (28, w800) ve hero alt satırı (14, w600). */
  heroTitle: { fontSize: 28, fontWeight: '800', color: colors.white },
  heroSub: { fontSize: 14, fontWeight: '600', color: colors.white },
} satisfies Record<string, TypeToken>;

export type TypeRole = keyof typeof scale;

/** Bir rolün tam `TextStyle` değeri (fontFamily dahil). */
export function textStyle(role: TypeRole, overrides: TextStyle = {}): TextStyle {
  return { fontFamily, ...scale[role], ...overrides };
}

/** Düğme yazısı: Flutter buton teması (15, w600). */
export const buttonText: TextStyle = { fontFamily, fontSize: 15, fontWeight: '600' };

/** Bağlantı yazısı: `label` rolü, primary renk. */
export const textButtonText: TextStyle = {
  fontFamily,
  fontSize: 14,
  fontWeight: '600',
  color: colors.primary,
};

/** Kod örneği yazısı (Flutter monospace 12). */
export const codeText: TextStyle = { fontFamily: 'monospace', fontSize: 12, fontWeight: '400', color: colors.onSurface };
