import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { LIST_TABS, type ListTab } from '../domain/subscriptionList';

/**
 * Flutter `PillTabBar`: yatay kaydırılabilir 40 px haplar, her birinde "Etiket sayı" yazısı.
 * Seçili hap primary dolgulu ve kalın yazılıdır.
 */
export function ListTabBar({
  active,
  counts,
  onChange,
}: {
  active: ListTab;
  counts: Record<ListTab, number>;
  onChange: (tab: ListTab) => void;
}) {
  useThemeRevision();
  return (
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
            style={[styles.pill, { backgroundColor: selected ? colors.primary : colors.surfaceHigh }]}
          >
            <Text style={selected ? textStyle('label', { color: colors.onPrimary }) : textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${tab.label} ${counts[tab.key]}`}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  bar: {
    flexGrow: 0,
    height: sizes.pillHeight,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  pill: {
    height: sizes.pillHeight,
    paddingHorizontal: gaps.pillX,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
