/**
 * Tanıtım sayfaları. İçerik ve sayı Flutter sürümüyle aynıdır (üç sayfa; bildirim izni burada
 * istenmez, bkz. USER_FLOWS §13).
 */

export interface OnboardingSlide {
  title: string;
  body: string;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    title: 'Aboneliklerini takip et',
    body: 'Netflix, Spotify, iCloud... Tüm aboneliklerini tek bir yerde topla ve ne kadar harcadığını gör.',
  },
  {
    title: 'Yenilemeleri kaçırma',
    body: 'Hangi aboneliğin ne zaman yenileneceğini takvimde gör, sürpriz ödemelerle karşılaşma.',
  },
  {
    title: 'Harcamalarını analiz et',
    body: 'Kategoriye göre ne kadar harcadığını gör, gereksiz abonelikleri tespit et ve tasarruf et.',
  },
];

export function isLastSlide(index: number): boolean {
  return index >= ONBOARDING_SLIDES.length - 1;
}
