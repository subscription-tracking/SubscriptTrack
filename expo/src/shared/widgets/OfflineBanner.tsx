import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, statusColors } from '../design/tokens';

/**
 * Ağ yokken gösterilen şerit. Son kaydedilen veri gösteriliyor olduğunu belirtir
 * ([USER_FLOWS §14](../../../../docs/product/USER_FLOWS.md)). Ağ durumunu kimin
 * izleyeceği Aşama 3'te belirlenir; bileşen yalnızca `visible` ile çalışır.
 */
export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.label}>Çevrimdışısın. Son kaydedilen veriler gösteriliyor.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceHigh,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    color: statusColors.warning,
    fontSize: 13,
    textAlign: 'center',
  },
});
