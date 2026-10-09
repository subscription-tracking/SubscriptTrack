import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Flutter `DashboardStatChipsRow`: üç eşit çip, aralarında 10 px. */
export function StatChips({ items }: { items: { icon: MaterialIconName; label: string }[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.chip}>
          <MaterialIcons name={item.icon} size={sizes.chipIcon} color={colors.primary} />
          <Text numberOfLines={2} style={[textStyle('chip'), styles.chipLabel]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Flutter `DashboardSectionHeader`: 20 px başlık ve isteğe bağlı sağda eylem bağlantısı. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={[textStyle('sectionTitle'), styles.headerTitle]}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={textStyle('bodySmallStrong', { color: colors.primary })}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: gaps.chip,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + spacing.xxs / 2,
    borderRadius: radius.chip,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: {
    flex: 1,
    marginLeft: gaps.heroLabel,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
});
