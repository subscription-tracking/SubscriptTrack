import { Children, type ReactNode, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { borderWidth, colors, radius, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';

/** Bölüm başlığı + gruplanmış satırlar kartı için kap: satırlar arası ince ayırıcı çizgi. */
export function GroupedList({ children }: { children: ReactNode }) {
  useThemeRevision();
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <View key={index} style={index > 0 ? styles.divider : undefined}>{row}</View>
      ))}
    </View>
  );
}

/**
 * Ayrıntı satırı: etiket solda, değer sağda. `onPress` verilirse satır dokunulabilir olur ve sağ başa
 * ok eklenir; en az 48 px yüksekliktedir.
 */
export function ListRow({
  label,
  value,
  onPress,
  accessibilityHint,
  icon,
  stacked = false,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  accessibilityHint?: string;
  icon?: ComponentProps<typeof MaterialIcons>['name'];
  stacked?: boolean;
}) {
  useThemeRevision();
  const content = (
    <View style={styles.row}>
      {icon ? <MaterialIcons name={icon} size={sizes.tileIcon} color={colors.onSurfaceVariant} /> : null}
      <View style={[styles.content, stacked && styles.stacked]}>
      <Text style={[textStyle('bodySmall', { color: colors.onSurfaceVariant }), styles.label]}>{label}</Text>
      <Text style={[textStyle('bodySmall'), styles.value, stacked && styles.stackedValue]} numberOfLines={stacked ? undefined : 2}>{value}</Text>
      </View>
      {onPress ? <MaterialIcons name="chevron-right" size={sizes.rowActionIcon} color={colors.onSurfaceVariant} /> : null}
    </View>
  );
  if (!onPress) return <View accessible accessibilityLabel={`${label}: ${value}`}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint ?? 'Düzenlemek için dokun'}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: { borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  label: { flexShrink: 0 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stacked: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.xxs },
  stackedValue: { textAlign: 'left', flex: 0 },
  value: { flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.7 },
}));
