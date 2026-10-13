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
    title: 'Aboneliklerini takip et',
    body: 'Netflix, Spotify, iCloud… Tüm aboneliklerini tek yerde topla, ne kadar harcadığını gör.',
    accent: onboardingColors.indigo,
    wash: onboardingColors.indigoWash,
    illustration: 'subscriptions',
  },
  {
    title: 'Yenilemeleri kaçırma',
    body: 'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
    accent: onboardingColors.green,
    wash: onboardingColors.greenWash,
    illustration: 'calendar',
  },
  {
    title: 'Harcamalarını analiz et',
    body: 'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri bul, tasarruf et.',
    accent: onboardingColors.amber,
    wash: onboardingColors.amberWash,
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
