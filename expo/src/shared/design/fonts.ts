/**
 * Pakete gömülü yazı tipleri: Hanken Grotesk statik ağırlıkları (SIL OFL 1.1,
 * `@expo-google-fonts/hanken-grotesk`). Çalışma zamanında indirilmez; güvenlik denetimi F-19.
 * Her ağırlık ayrı bir aile adıyla kayıtlıdır; Android'de `fontWeight` kullanılmaz, böylece
 * kalın başlıklar sistem fontuna düşmez ve sentetik kalınlaştırma oluşmaz.
 */
import { HankenGrotesk_400Regular } from '@expo-google-fonts/hanken-grotesk/400Regular';
import { HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk/500Medium';
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk/700Bold';

export const appFonts = {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
};

export type FontWeightName = 400 | 500 | 600 | 700;

export const fontFamilies: Record<FontWeightName, keyof typeof appFonts> = {
  400: 'HankenGrotesk_400Regular',
  500: 'HankenGrotesk_500Medium',
  600: 'HankenGrotesk_600SemiBold',
  700: 'HankenGrotesk_700Bold',
};
