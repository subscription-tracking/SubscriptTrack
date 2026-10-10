import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../design/tokens';

/**
 * Alt ekranın sonunda güvenli alt alan kadar boşluk (ana sayfa çubuğu / home indicator). Alt gezinme olmayan
 * ekranlar sabit `bottomNavHeight` yerine bunu kullanır.
 */
export function ScreenBottomInset() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.bottom + spacing.xl }} />;
}
