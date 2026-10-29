import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

/** Ana sayfa bölüm başlığı: solda başlık, isteğe bağlı sayı rozeti, sağda eylem bağlantısı. */
export function SectionHeader({
  title,
  action,
  onAction,
  badge,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  badge?: number;
}) {
  useThemeRevision();
  return (
    <View style={styles.header}>
      <Text style={textStyle('heading')}>{title}</Text>
      {badge ? (
        <View style={styles.badge} accessibilityLabel={`${badge} kayıt`}>
          <Text style={textStyle('captionStrong', { color: colors.onErrorContainer })}>{badge}</Text>
        </View>
      ) : null}
      <View style={styles.spacer} />
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={textStyle('label', { color: colors.primary })}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
  action: { minHeight: sizes.minTouchTarget, justifyContent: 'center' },
  badge: {
    marginLeft: spacing.xs,
    minWidth: spacing.lg,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.chip,
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
  },
}));
