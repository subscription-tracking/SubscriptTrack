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

/** Metin ve yüzey opaklıkları. Ekranlar ham rgba yazmaz; bu değerleri `withAlpha` ile uygular. */
export const opacity = {
  /** Yardımcı metin (marka satırı gibi). */
  muted: 0.55,
  /** Sayfa noktası (tanıtım) dolgu opaklığı. */
  dot: 0.18,
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
  /** Metin için açık "muted" (zemin üzerinde ≥4.5:1). Flutter `muted` değerinden sapma; yalnızca küçük metinde kullanılır. */
  mutedText: '#8A92A3',
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
  /** Flutter ara köşe değerleri: çip ve kısa kartlar (12), hızlı işlem (16), giriş kutusu (18). */
  chip: 12,
  tile: 16,
  intro: 18,
  /** İstatistik kart köşesi (24), çip (8), ikon kutusu (12, zaten chip). */
  statsCard: 24,
  choice: 8,
  /** Detay hero logo kutusu (22). */
  logo: 22,
  /** Alt sayfa üst köşesi (Flutter M3 28). */
  sheet: 28,
  /** Form satırı ve açılır seçim köşesi (12) ve bölüm kutusu (16). */
  field: 12,
  section: 16,
} as const;

/** Flutter `OutlineInputBorder`/`BorderSide(width: 0.5)` ve `1.5` kalınlıkları. */
export const borderWidth = {
  hairline: 0.5,
  focused: 1.5,
  /** Flutter `Border.all(color)` varsayılanı. */
  regular: 1,
  /** Ana sayfa sıradaki ödeme kartı (0.75). */
  card: 0.75,
  /** İstatistik kartı ve satır kenarlığı (Flutter 0.8). */
  statsEdge: 0.8,
} as const;

/** Dashboard ve kartlarda Flutter'ın kullandığı ara boşluklar. */
export const gaps = {
  heroLabel: 6,
  chip: 10,
  sectionTop: 28,
  rowLoose: 14,
  cardInset: 16,
  hint: 8,
  trialCard: 10,
  legendRow: 4,
  /** Bölüm başlığı altı (12) ve donut kartı üstü (12). */
  sectionInner: 12,
  /** Sekme hap yatay boşluğu (14) ve alt sayfa dolgu değerleri. */
  pillX: 14,
  sheetRow: 12,
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
  /** Flutter `AppBar` varsayılan yüksekliği (alt sayfa üst barı). */
  appBarHeight: 56,
  /** Flutter `AppBar` geri düğmesi alanı. */
  appBarLeadingWidth: 56,
  /** Alt gezinme aktif gösterge çizgisi: genişlik ve yükseklik. */
  navIndicatorWidth: 30,
  navIndicatorHeight: 2,
  navIconSize: 22,
  /** Flutter `IconButton` varsayılan ikon boyutu. */
  iconButtonSize: 24,
  /** Üst bar ikon kutusu (28 × 28) ve ikon boyutu. */
  topBarIconBox: 28,
  topBarIconSize: 18,
  /** Üst bar bildirim rozeti. */
  badgeSize: 16,
  /** Ana sayfa halkası (Flutter `MonthProgressRing` 64 px). */
  ringSize: 64,
  /** Kahraman kartı ikonları (16) ve chevron (18). */
  heroIcon: 16,
  /** Dashboard çip ikonu (Flutter 14). */
  chipIcon: 14,
  /** Düğme ikonu (Flutter `FilledButton.icon` 18). */
  buttonIcon: 18,
  chevronIcon: 18,
  /** Sıradaki ödeme kartındaki "Detay" chevron'u (14). */
  chevronSmall: 14,
  /** Ana sayfa sıradaki ödeme avatarı (46) ve kart ikonu (15). */
  nextPaymentAvatar: 46,
  hintIcon: 15,
  /** Dashboard donut kutusu (112) ve hızlı işlem düğmesi dairesi (38) ve ikonu (20). */
  donutSize: 112,
  quickActionCircle: 38,
  quickActionIcon: 20,
  /** Boş durum dairesi (56) ve ikonu (26). */
  emptyCircle: 56,
  emptyIcon: 26,
  /** Ödeme yöntemleri boş durum ikonu (Flutter 48) ve satır düzenle/sil ikonu (Flutter 20). */
  emptyStateIcon: 48,
  rowActionIcon: 20,
  /** Gösterge noktası (lejant) 8 px. */
  legendDot: 8,
  /** İstatistik: hero dolgusu (22), rozet ikonu (14), yüzde sütunu (40), ilerleme çubuğu (6), trend alanı (140), uyarı ikonu (22), içgörü avatarı (36). */
  heroPadding: 22,
  badgeIcon: 14,
  percentWidth: 40,
  progressHeight: 6,
  trendHeight: 140,
  warningIcon: 22,
  insightAvatar: 36,
  /** Arama alanı: ikon 20, temizle 18, yükseklik 56 (Flutter TextField içerik yüksekliği). */
  searchIcon: 20,
  clearIcon: 18,
  searchHeight: 56,
  /** Alt sayfa tutamağı 32×4; radyo dış çap 20, iç nokta 10; ikon düğmesi 48. */
  sheetHandleWidth: 32,
  sheetHandleHeight: 4,
  radioOuter: 20,
  radioInner: 10,
  iconButton: 48,
  /** Bağlantı düğmelerindeki ikon (Flutter TextButton.icon 18). */
  linkIcon: 18,
  /** Detay ekranı: hero yüksekliği 270 (+ güvenli alan), logo kutusu 76, hero ikonu 44, cam düğme 40, menü ikonu 20. */
  heroHeight: 270,
  heroLogo: 76,
  heroLogoIcon: 44,
  glassButton: 40,
  glassIcon: 18,
  menuIcon: 20,
  detailCardIcon: 15,
  detailTileCircle: 28,
  paymentMethodBox: 44,
  /** Detay menüsü genişliği. */
  menuWidth: 184,
  /** Detay eylem düğmesi yüksekliği (48) ve iptal ikonu (20). */
  detailButtonHeight: 48,
  /** Tanıtım illüstrasyonu: merkez ikon (26) ve halo çapı (118). */
  centerIcon: 26,
  /** Para birimi seçili işareti (20). */
  checkIcon: 20,
  /** Arşiv boş durum ikonu (64) ve kart avatarı (40). */
  archiveIcon: 64,
  archiveAvatar: 40,
  /** Bildirim avatarı (40), emoji (18), okunmamış nokta (10), kaydırma çıkış mesafesi (400). */
  notificationAvatar: 40,
  notificationEmoji: 18,
  unreadDot: 10,
  rowExit: 400,
  /** Ayarlar: satır ikonu (20), hesap avatarı (52), çıkış ikonu (18). */
  tileIcon: 20,
  accountAvatar: 52,
  signOutIcon: 18,
  /** Profil avatarı (80). */
  profileAvatar: 80,
  /** Takvim: gün hücresi yüksekliği (40), hücre iç boşluğu (3), yenileme noktası (5, alttan 5), ay gezinme ikonu (24), etkinlik avatarı (40). */
  calendarCell: 40,
  calendarCellInset: 3,
  calendarDot: 6,
  calendarDotBottom: 5,
  calendarNavIcon: 24,
  calendarAvatar: 40,
  /** Boş gün dairesi (52) ve ikonu (24). */
  emptyDayCircle: 52,
  emptyDayIcon: 24,
  /** Tarih satırı minimum yüksekliği (Flutter ListTile 56). */
  tileMinHeight: 56,
  /** Tanıtım: marka noktası (8), aktif/pasif sayfa noktası (24/6), bilgi sayfası yatay boşluğu (32), başlık–illüstrasyon boşluğu (44), metin satır yüksekliği (26), düğme köşesi (16). */
  brandDot: 8,
  dotActive: 24,
  dotInactive: 6,
  infoGutter: 32,
  illustrationGap: 44,
  bodyLine: 26,
  onboardingButtonRadius: 16,
  /** Para birimi sayfası çipi (34) ve sembol rozeti (36). */
  currencyChip: 34,
  currencyBadge: 36,
  glowCore: 118,
  cancelIcon: 20,
  /** Sonraki ödeme kartı sağ çizgi (4), gün sayısı satır yüksekliği (24), ödeme yöntemi ikonu (24). */
  stripeWidth: 4,
  dayCountLine: 24,
  detailMethodIcon: 24,
  /** Liste kartı hizmet kimliği (42). */
  listAvatar: 42,
  /** Boş durum: büyük (64 daire, 28 ikon) ve kompakt (48 daire, 22 ikon). */
  emptyOrbLarge: 64,
  emptyIconLarge: 28,
  emptyOrbCompact: 48,
  emptyIconCompact: 22,
  /** Sekme hapları ve arama başlığı: hap yüksekliği 40, arama ekle düğmesi 48. */
  pillHeight: 40,
  /** Filtre paneli ikon düğmesi ve sekme ikon boyutu (24). */
  filterIcon: 24,
} as const;

/** Flutter'daki seyrek ölçüler: üst bar ikon kutusu köşesi, alt gezinme gösterge boşluğu. */
export const extraSpacing = {
  navIndicatorGap: 7,
  navLabelGap: 3,
  topBarSubtitleGap: 2,
  topBarIconGap: 10,
  /** Auth başlık bloğu (Flutter `authHeaderChildren`): marka → simge 28, başlık → alt metin 6. */
  brandToOrb: 28,
  titleToSubtitle: 6,
} as const;

export const extraRadius = {
  topBarIcon: 10,
  navIndicator: 2,
} as const;

export type ColorToken = keyof typeof colors;
export type StatusColorToken = keyof typeof statusColors;
