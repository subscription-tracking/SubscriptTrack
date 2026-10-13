import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { chartColors } from '../../../../shared/design/chartTheme';
import { textStyle } from '../../../../shared/design/typography';

/**
 * Flutter `ActionCards`: tasarruf analizi ve ödeme geçmişine iki eşit kısayol kartı.
 */
export function ActionCards({ onSavings, onPaymentHistory }: { onSavings: () => void; onPaymentHistory: () => void }) {
  useThemeRevision();
  return (
    <View style={styles.row}>
      <ActionTile icon="trending-down" tone={chartColors.emerald} title="Tasarruf Analizi" subtitle="Tasarruf fırsatları" onPress={onSavings} />
      <View style={styles.gap} />
      <ActionTile icon="receipt-long" tone={colors.primary} title="Ödeme Geçmişi" subtitle="Kayıtları yönet" onPress={onPaymentHistory} />
    </View>
  );
}

function ActionTile({
  icon,
  tone,
  title,
  subtitle,
  onPress,
}: {
  icon: 'trending-down' | 'receipt-long';
  tone: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  useThemeRevision();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}>
      <View style={[styles.iconBox, { backgroundColor: withAlpha(tone, 0.12) }]}>
        <MaterialIcons name={icon} size={sizes.iconButtonSize - spacing.xxs} color={tone} />
      </View>
      <Text style={textStyle('label', { marginTop: gaps.sectionInner - 2 })} numberOfLines={1}>
        {title}
      </Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  gap: {
    width: gaps.sectionInner - 8,
  },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.statsEdge,
    borderColor: withAlpha(colors.outline, 0.6),
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  iconBox: {
    alignSelf: 'flex-start',
    padding: spacing.xs,
    borderRadius: radius.chip,
  },
}));
