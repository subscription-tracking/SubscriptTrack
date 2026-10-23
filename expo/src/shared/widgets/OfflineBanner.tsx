import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, statusColors } from '../design/tokens';

/**
 * Ağ yokken gösterilen şerit. Son kaydedilen veri gösteriliyor olduğunu belirtir
 * ([USER_FLOWS §14](../../../../docs/product/USER_FLOWS.md)). Bekleyen yazım varsa sayısını da
 * gösterir. Ağ durumunu kimin izleyeceği feature katmanında belirlenir; bileşen yalnızca props ile çalışır.
 */
export function OfflineBanner({ visible, pendingCount = 0 }: { visible: boolean; pendingCount?: number }) {
  useThemeRevision();
  if (!visible && pendingCount === 0) return null;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="Çevrimdışı eşitleme durumu"
      accessibilityLiveRegion="polite"
    >
      {visible ? <Text style={styles.label}>Çevrimdışısın. Son kaydedilen veriler gösteriliyor.</Text> : null}
      {pendingCount > 0 ? (
        <Text style={styles.label}>{pendingCount} değişiklik bağlantı gelince gönderilecek.</Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
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
}));
