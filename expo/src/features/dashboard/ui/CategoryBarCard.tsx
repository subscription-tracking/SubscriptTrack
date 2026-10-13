import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { categoryPalette } from '../../../shared/design/chartTheme';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { StackedBar } from '../../../shared/widgets/ProgressBar';
import { type CategoryTotal, donutEntries } from '../domain/dashboardHero';

const MAX_LEGEND = 4;

/** "Bu ayın dağılımı": ana para birimindeki kategori gruplarını yığılmış çubuk ve lejantla gösterir. */
export function CategoryBarCard({ totals, onPress }: { totals: CategoryTotal[]; onPress: () => void }) {
  useThemeRevision();
  const { entries, total } = donutEntries(totals);
  if (entries.length === 0 || total <= 0) return null;
  const palette = categoryPalette();
  const colorAt = (index: number) => palette[index % palette.length];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Bu ayın dağılımını aç, İstatistikler"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={textStyle('heading')}>Bu ayın dağılımı</Text>
      <View style={styles.bar}>
        <StackedBar
          accessibilityLabel={`Kategori dağılımı: ${entries.map((entry) => entry.group).join(', ')}`}
          segments={entries.map((entry, index) => ({ key: entry.group, weight: entry.amount.amount, color: colorAt(index) }))}
        />
      </View>
      {entries.slice(0, MAX_LEGEND).map((entry, index) => (
        <View key={entry.group} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: colorAt(index) }]} />
          <Text style={textStyle('bodySmall', { flex: 1, marginLeft: spacing.xs })} numberOfLines={1}>{entry.group}</Text>
          <Text style={textStyle('label')}>{formatCurrency(entry.amount, entry.currency)}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  card: {
    padding: gaps.cardInset,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  bar: { marginVertical: gaps.sectionInner },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: gaps.legendRow },
  dot: { width: sizes.legendDot, height: sizes.legendDot, borderRadius: sizes.legendDot / 2 },
}));
