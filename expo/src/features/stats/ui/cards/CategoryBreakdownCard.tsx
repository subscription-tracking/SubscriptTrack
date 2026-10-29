import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { useGrowIn } from '../../../../shared/widgets/useGrowIn';
import { CATEGORY_LABELS, type SubscriptionCategory } from '../../../subscriptions/domain/subscription';
import { categorySummary } from '../../domain/chartSummary';
import { percentShares } from '../../domain/percentShares';
import { categoryColor } from './categoryColor';

export interface CategoryEntry {
  category: SubscriptionCategory;
  monthly: Money;
}

/**
 * Flutter `CategoryBreakdownCard`: "Kategori dağılımı", kategori sayısı, her kategori için sabit renkli nokta,
 * ad, tutar, yüzde ve ilerleme çubuğu. Yüzdeler en büyük kalan yöntemiyle yuvarlanır (toplam %100). Çubuklar
 * ilk girişte büyür; ekran okuyucu her kategori için yüzdeyi ve kartın özetini okur.
 */
export function CategoryBreakdownCard({ entries, total, currency }: { entries: CategoryEntry[]; total: Money; currency: string }) {
  useThemeRevision();
  const shares = percentShares(
    entries.map((entry) => entry.monthly.minorUnits),
    total.minorUnits,
  );
  const grow = useGrowIn(entries.length);
  const topIndex = entries.reduce((best, entry, index) => (entry.monthly.minorUnits > entries[best].monthly.minorUnits ? index : best), 0);
  const summary = categorySummary({
    count: entries.length,
    totalText: formatCurrency(total, currency),
    topName: entries[topIndex] ? CATEGORY_LABELS[entries[topIndex].category] : null,
    topPercent: shares[topIndex] ?? 0,
  });

  return (
    <View style={styles.section}>
      <View style={styles.header} accessible accessibilityLabel={summary}>
        <Text style={textStyle('heading', { flex: 1 })}>
          Kategori dağılımı
        </Text>
        <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginLeft: spacing.xs })}>{`${entries.length} kategori`}</Text>
      </View>
      <View style={styles.gap} />
      {entries.map((entry, index) => {
        const share = shares[index] ?? 0;
        const color = categoryColor(entry.category);
        const width = grow[index].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${share}%`] });
        return (
          <View key={entry.category} style={styles.row}>
            <View style={styles.line}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={textStyle('label', { flex: 1, marginLeft: spacing.sm })}>
                {CATEGORY_LABELS[entry.category]}
              </Text>
              <Text style={textStyle('label')}>{formatCurrency(entry.monthly, currency)}</Text>
              {entries.length > 1 && total.minorUnits > 0 ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, width: sizes.percentWidth, textAlign: 'right', marginLeft: spacing.xs })}>
                {`%${share}`}
              </Text> : null}
            </View>
            {entries.length > 1 && total.minorUnits > 0 ? <View
              style={styles.track}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={CATEGORY_LABELS[entry.category]}
              accessibilityValue={{ min: 0, max: 100, now: share }}
            >
              <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
            </View> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  section: { paddingVertical: spacing.lg, borderTopWidth: borderWidth.hairline, borderTopColor: colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gap: {
    height: spacing.lg - spacing.xxs / 2,
  },
  row: {
    marginBottom: spacing.md,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dot: {
    width: sizes.legendDot + spacing.xxs / 2,
    height: sizes.legendDot + spacing.xxs / 2,
    borderRadius: sizes.legendDot,
  },
  track: {
    marginTop: spacing.xs,
    height: sizes.progressHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
}));
