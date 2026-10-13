import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { useGrowIn } from '../../../../shared/widgets/useGrowIn';
import { CATEGORY_LABELS, type SubscriptionCategory } from '../../../subscriptions/domain/subscription';
import { categorySummary } from '../../domain/chartSummary';
import { percentShares } from '../../domain/percentShares';
import { categoryColor } from './categoryColor';
import { StatsCardSurface } from './StatsCardSurface';

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
    <StatsCardSurface>
      <View style={styles.header} accessible accessibilityLabel={summary}>
        <Text style={textStyle('bodyStrong', { flex: 1 })} numberOfLines={1}>
          Kategori dağılımı
        </Text>
        <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginLeft: spacing.xs })}>{`${entries.length} kategori`}</Text>
      </View>
      <View style={styles.gap} />
      {entries.map((entry, index) => {
        const share = shares[index] ?? 0;
        const color = categoryColor(entry.category);
        const width = grow[index].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(1, share)}%`] });
        return (
          <View key={entry.category} style={styles.row}>
            <View style={styles.line}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={textStyle('label', { flex: 1, marginLeft: spacing.sm })} numberOfLines={1}>
                {CATEGORY_LABELS[entry.category]}
              </Text>
              <Text style={textStyle('label')}>{formatCurrency(entry.monthly, currency)}</Text>
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, width: sizes.percentWidth, textAlign: 'right', marginLeft: spacing.xs })}>
                {`%${share}`}
              </Text>
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityLabel={CATEGORY_LABELS[entry.category]}
              accessibilityValue={{ min: 0, max: 100, now: share }}
            >
              <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </StatsCardSurface>
  );
}

const styles = themedStyles(() => StyleSheet.create({
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
