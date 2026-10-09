import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { LIST_TABS, type ListTab } from '../domain/subscriptionList';

/** Liste sekmeleri: yatay kaydırılabilir hap (pill) düğmeler, her birinde sayı rozeti. */
export function ListTabBar({
  active,
  counts,
  onChange,
}: {
  active: ListTab;
  counts: Record<ListTab, number>;
  onChange: (tab: ListTab) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {LIST_TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            hitSlop={spacing.xs}
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={textStyle('label', { color: selected ? colors.onPrimary : colors.onSurfaceVariant })}>
              {`${tab.label} ${counts[tab.key]}`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pill: {
    minHeight: sizes.minTouchTarget - 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
});
