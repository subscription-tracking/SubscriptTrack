import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { LIST_TABS, type ListTab } from '../domain/subscriptionList';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
export type ListAction = { label: string; icon: MaterialIconName; onPress: () => void; danger?: boolean; disabled?: boolean; accessibilityLabel: string };

/**
 * Flutter `PillTabBar`: yatay kaydırılabilir 40 px haplar, her birinde "Etiket sayı" yazısı.
 * Seçili hap primary dolgulu ve kalın yazılıdır.
 */
export function ListTabBar({
  active,
  counts,
  onChange,
  actions = [],
}: {
  active: ListTab;
  counts: Record<ListTab, number>;
  onChange: (tab: ListTab) => void;
  actions?: ListAction[];
}) {
  useThemeRevision();
  return (
    <View style={styles.toolbar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bar}
        contentContainerStyle={styles.row}
      >
        {LIST_TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${tab.label} ${counts[tab.key]}`}
              onPress={() => onChange(tab.key)}
              style={[styles.pill, selected ? styles.pillSelected : styles.pillIdle]}
            >
              <Text style={selected ? textStyle('label', { color: colors.primary }) : textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${tab.label} ${counts[tab.key]}`}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.accessibilityLabel}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              accessibilityState={{ disabled: !!action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              style={({ pressed }) => [styles.action, action.danger && styles.actionDanger, action.disabled && styles.actionDisabled, pressed && styles.actionPressed]}
            >
              <MaterialIcons name={action.icon} size={sizes.rowActionIcon} color={action.danger ? colors.error : colors.onSurfaceVariant} />
              <Text style={textStyle('captionStrong', { color: action.danger ? colors.error : colors.onSurfaceVariant })}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bar: {
    flex: 1,
    minWidth: 0,
    width: 0,
    minHeight: sizes.minTouchTarget,
  },
  row: {
    gap: spacing.xs,
  },
  pill: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: gaps.pillX,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: { backgroundColor: withAlpha(colors.primary, 0.18), borderWidth: 1, borderColor: colors.primary },
  pillIdle: { backgroundColor: colors.surface, borderWidth: borderWidth.hairline, borderColor: colors.border },
  actions: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  action: {
    minHeight: sizes.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
  },
  actionDanger: {
    backgroundColor: withAlpha(colors.error, 0.12),
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionPressed: {
    opacity: 0.75,
  },
}));
