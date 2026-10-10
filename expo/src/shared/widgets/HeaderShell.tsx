import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenGutter, sizes } from '../design/tokens';

/**
 * Tüm üst barların ortak kabuğu: üst güvenli alan, en az yükseklik, ekran kenar boşluğu ve arka plan.
 * Kök (tab) barı `TopBar`, geri düğmeli alt ekran barı `ScreenTopBar` bunu kullanır; böylece iki düzeyde de
 * sol kenar, üst boşluk ve yükseklik aynı kuralla hesaplanır.
 */
export function HeaderShell({
  minHeight = sizes.minTouchTarget,
  style,
  children,
}: {
  /** İçerik yüksekliği (güvenli alan hariç). */
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.shell, { paddingTop: insets.top, minHeight: minHeight + insets.top }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenGutter,
    backgroundColor: colors.background,
  },
});
