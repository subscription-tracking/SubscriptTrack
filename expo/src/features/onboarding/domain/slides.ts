/**
 * Tanıtım sayfaları (Flutter `OnboardingScreen._slides` ve `CurrencyPage._options` ile aynı).
 * Bildirim izni burada istenmez (bkz. USER_FLOWS §13). Renk değerleri tokenlardan gelir.
 */

import { onboardingColors } from '../../../shared/design/palette';

export type IllustrationKey = 'subscriptions' | 'calendar' | 'analytics';

export interface OnboardingSlide {
  title: string;
  body: string;
  accent: string;
  wash: string;
  illustration: IllustrationKey;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    title: 'Aboneliklerin, tek yerde.',
    body: 'Ücretlerini ve yenileme tarihlerini kolayca takip et.',
    accent: onboardingColors.indigo,
    wash: onboardingColors.indigoWash,
    illustration: 'subscriptions',
  },
  {
    title: 'Yenilemeden önce haberdar ol.',
    body: 'Yaklaşan ödemelerini gör, hatırlatmalarını ayarla.',
    accent: onboardingColors.indigo,
    wash: onboardingColors.indigoWash,
    illustration: 'calendar',
  },
  {
    title: 'Harcamalarını net gör.',
    body: 'Aylık abonelik giderlerini ve dağılımını incele.',
    accent: onboardingColors.indigo,
    wash: onboardingColors.indigoWash,
    illustration: 'analytics',
  },
];

/** Para birimi sayfası: üç bilgi sayfasından sonra gelir. */
export const CURRENCY_PAGE = { accent: onboardingColors.indigo, wash: onboardingColors.indigoWash };

/** Seçilebilir üç aktif para birimi (`core/domain/activeCurrency`). Seçim koddur; sembol yalnızca gösterimdir. */
export const CURRENCY_OPTIONS = [
  { symbol: '₺', name: 'Türk Lirası', code: 'TRY' },
  { symbol: '$', name: 'ABD Doları', code: 'USD' },
  { symbol: '€', name: 'Euro', code: 'EUR' },
] as const;

/** Toplam sayfa sayısı: bilgi sayfaları + para birimi. */
export const ONBOARDING_PAGE_COUNT = ONBOARDING_SLIDES.length + 1;

export function isCurrencyPage(index: number): boolean {
  return index === ONBOARDING_SLIDES.length;
}

export function isLastPage(index: number): boolean {
  return index === ONBOARDING_PAGE_COUNT - 1;
}
