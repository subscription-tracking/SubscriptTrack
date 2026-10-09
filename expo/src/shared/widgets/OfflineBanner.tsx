import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, statusColors } from '../design/tokens';

/**
 * Ağ yokken gösterilen şerit. Son kaydedilen veri gösteriliyor olduğunu belirtir
 * ([USER_FLOWS §14](../../../../docs/product/USER_FLOWS.md)). Bekleyen yazım varsa sayısını da
 * gösterir. Ağ durumunu kimin izleyeceği feature katmanında belirlenir; bileşen yalnızca props ile çalışır.
 */
export function OfflineBanner({ visible, pendingCount = 0 }: { visible: boolean; pendingCount?: number }) {
  if (!visible && pendingCount === 0) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      {visible ? <Text style={styles.label}>Çevrimdışısın. Son kaydedilen veriler gösteriliyor.</Text> : null}
      {pendingCount > 0 ? (
        <Text style={styles.label}>{pendingCount} değişiklik bağlantı gelince gönderilecek.</Text>
      ) : null}
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
    gap: spacing.xxs,
  },
  label: {
    color: statusColors.warning,
    fontSize: 12,
    textAlign: 'center',
  },
});
