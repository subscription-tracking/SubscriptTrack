import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatAmount } from '../../../core/format/money';
import { borderWidth, colors, gaps, radius, sizes, spacing, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { DonutChart } from '../../../shared/widgets/DonutChart';
import { categorySummary } from '../../stats/domain/chartSummary';
import { percentShares } from '../../stats/domain/percentShares';
import { type CategoryGroup, type CategoryTotal, donutEntries } from '../domain/dashboardHero';
import { SectionHeader } from './StatChips';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Flutter `_groupColor`: Eğlence birincil, Müzik başarı, Üretkenlik ikincil, Araçlar uyarı rengi. */
function groupColor(group: CategoryGroup): string {
  switch (group) {
    case 'Eğlence':
      return colors.primary;
    case 'Müzik':
      return statusColors.success;
    case 'Üretkenlik':
      return colors.secondary;
    case 'Araçlar':
      return statusColors.warning;
  }
}

/** Flutter `DashboardCategoryDonutCard`: bu ayın kategori dağılımı; en fazla üç lejant satırı. */
export function CategoryDonutCard({ totals, onAll }: { totals: CategoryTotal[]; onAll: () => void }) {
  if (totals.length === 0) return null;
  const { primaryCurrency, entries, total } = donutEntries(totals);
  const shares = percentShares(
    entries.map((entry) => entry.amount.minorUnits),
    entries.reduce((sum, entry) => sum + entry.amount.minorUnits, 0),
  );
  const slices = entries.map((entry) => ({
    fraction: total === 0 ? 0 : entry.amount.amount / total,
    color: groupColor(entry.group),
  }));
  const summary = categorySummary({
    count: entries.length,
    totalText: formatAmount(total, primaryCurrency),
    topName: entries[0]?.group ?? null,
    topPercent: shares[0] ?? 0,
  });
  return (
    <View>
      <SectionHeader title="Bu ayın görünümü" action="Tüm kategoriler" onAction={onAll} />
      <View style={styles.gapBelowHeader} />
      <View style={styles.donutCard}>
        <DonutChart size={sizes.donutSize} slices={slices} trackColor={colors.outline} accessibilityLabel={summary}>
          <View style={styles.donutCenter}>
            <Text style={textStyle('donutTotal')} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {formatAmount(total, primaryCurrency)}
            </Text>
            <Text style={textStyle('donutLabel', { color: withAlpha(colors.onSurfaceVariant, 0.9), marginTop: spacing.xxs / 2 })}>toplam</Text>
          </View>
        </DonutChart>
        <View style={styles.legend}>
          {entries.slice(0, 3).map((entry, index) => (
            <View key={entry.group} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: groupColor(entry.group) }]} />
              <Text style={textStyle('bodySmall', { flex: 1, marginLeft: spacing.xs })} numberOfLines={1}>
                {entry.group}
              </Text>
              <Text style={textStyle('bodySmallStrong')}>{`%${shares[index] ?? 0}`}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export interface QuickAction {
  icon: MaterialIconName;
  label: string;
  color: string;
  onPress: () => void;
}

/** Flutter `DashboardQuickActionsRow`: üç eşit düğme, aralarında 10 px. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View>
      <Text style={textStyle('bodyLargeStrong', { color: withAlpha(colors.onSurfaceVariant, 0.9), marginLeft: spacing.xxs, marginBottom: gaps.sectionInner })}>
        Hızlı işlemler
      </Text>
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <View style={[styles.actionCircle, { backgroundColor: withAlpha(action.color, 0.12) }]}>
              <MaterialIcons name={action.icon} size={sizes.quickActionIcon} color={action.color} />
            </View>
            <Text numberOfLines={1} style={textStyle('chipStrong', { marginTop: gaps.hint })}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gapBelowHeader: {
    height: gaps.sectionInner,
  },
  donutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: gaps.cardInset,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  donutCenter: {
    alignItems: 'center',
    maxWidth: sizes.donutSize - spacing.xxxl,
  },
  legend: {
    flex: 1,
    marginLeft: gaps.cardInset,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: gaps.legendRow,
  },
  legendDot: {
    width: sizes.legendDot,
    height: sizes.legendDot,
    borderRadius: sizes.legendDot / 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: gaps.chip,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: gaps.rowLoose,
    paddingHorizontal: spacing.sm - spacing.xxs / 2,
    borderRadius: radius.tile,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionCircle: {
    width: sizes.quickActionCircle,
    height: sizes.quickActionCircle,
    borderRadius: sizes.quickActionCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
