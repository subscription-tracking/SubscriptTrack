import { StyleSheet, Text, View } from 'react-native';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { chartPalette } from '../../../../shared/design/palette';
import { textStyle } from '../../../../shared/design/typography';
import { CATEGORY_LABELS, type SubscriptionCategory } from '../../../subscriptions/domain/subscription';
import { StatsCardSurface } from './StatsCardSurface';

export interface CategoryEntry {
  category: SubscriptionCategory;
  monthly: Money;
}

/**
 * Flutter `CategoryBreakdownCard`: "Kategori Dağılımı", kategori sayısı, her kategori için renkli nokta,
 * ad, tutar, yüzde ve ilerleme çubuğu. Renkler sırayla döner.
 */
export function CategoryBreakdownCard({ entries, total, currency }: { entries: CategoryEntry[]; total: Money; currency: string }) {
  return (
    <StatsCardSurface>
      <View style={styles.header}>
        <Text style={textStyle('cardTitle', { flex: 1 })} numberOfLines={1}>
          Kategori Dağılımı
        </Text>
        <Text style={textStyle('bodySmallStrong', { color: colors.onSurfaceVariant, marginLeft: spacing.xs })}>{`${entries.length} Kategori`}</Text>
      </View>
      <View style={styles.gap} />
      {entries.map((entry, index) => {
        const share = total.minorUnits === 0 ? 0 : entry.monthly.minorUnits / total.minorUnits;
        const color = chartPalette[index % chartPalette.length];
        return (
          <View key={entry.category} style={styles.row}>
            <View style={styles.line}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={textStyle('bodySmallStrong', { flex: 1, marginLeft: spacing.sm })} numberOfLines={1}>
                {CATEGORY_LABELS[entry.category]}
              </Text>
              <Text style={textStyle('bodySmallStrong')}>{formatCurrency(entry.monthly, currency)}</Text>
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, width: sizes.percentWidth, textAlign: 'right', marginLeft: spacing.xs })}>
                {`%${Math.round(share * 100)}`}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0.01, share)) * 100)}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </StatsCardSurface>
  );
}

const styles = StyleSheet.create({
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
});
