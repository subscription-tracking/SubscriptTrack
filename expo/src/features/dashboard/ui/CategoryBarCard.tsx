import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { categoryPalette } from '../../../shared/design/chartTheme';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { StackedBar } from '../../../shared/widgets/ProgressBar';
import { type CategoryGroup, type CategoryTotal } from '../domain/dashboardHero';

const MAX_LEGEND = 4;
const GROUP_COLOR_INDEX: Record<CategoryGroup, number> = { Eğlence: 0, Müzik: 1, Üretkenlik: 2, Araçlar: 3 };

/** Ana para birimindeki tahmini aylık eşdeğerleri kategori gruplarına ayırır. */
export function CategoryBarCard({ totals, onPress }: { totals: CategoryTotal[]; onPress: () => void }) {
  useThemeRevision();
  const currencies = [...new Set(totals.map((entry) => entry.currency))].sort();
  if (new Set(totals.filter((entry) => entry.amount.minorUnits > 0).map((entry) => entry.group)).size < 2) return null;
  const palette = categoryPalette();
  const colorFor = (group: CategoryGroup) => palette[GROUP_COLOR_INDEX[group]];
  const breakdown = totals
    .map((entry) => `${entry.group}: ${formatCurrency(entry.amount, entry.currency)}`)
    .join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tahmini aylık dağılım. ${breakdown}. İstatistikleri aç`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={textStyle('heading')}>Tahmini aylık dağılım</Text>
      {currencies.map((currency) => {
        const entries = totals.filter((entry) => entry.currency === currency && entry.amount.minorUnits > 0).sort((a, b) => b.amount.minorUnits - a.amount.minorUnits);
        if (!entries.length) return null;
        return <View key={currency} style={styles.currencyGroup}>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{currency}</Text>
      {entries.length > 1 ? <View style={styles.bar}>
        <StackedBar
          accessibilityLabel={`Kategori dağılımı: ${entries.map((entry) => entry.group).join(', ')}`}
          segments={entries.map((entry) => ({ key: entry.group, weight: entry.amount.minorUnits, color: colorFor(entry.group) }))}
        />
      </View> : null}
      {entries.slice(0, MAX_LEGEND).map((entry) => (
        <View key={entry.group} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: colorFor(entry.group) }]} />
          <Text style={textStyle('bodySmall', { flex: 1, marginLeft: spacing.xs })} numberOfLines={1}>{entry.group}</Text>
          <Text style={textStyle('label')}>{formatCurrency(entry.amount, entry.currency)}</Text>
        </View>
      ))}
      </View>;
      })}
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
  currencyGroup: { marginTop: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: gaps.legendRow },
  dot: { width: sizes.legendDot, height: sizes.legendDot, borderRadius: sizes.legendDot / 2 },
}));
