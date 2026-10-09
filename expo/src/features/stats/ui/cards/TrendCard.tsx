import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Money } from '../../../../core/domain/money';
import { formatCurrency } from '../../../../core/format/money';
import { colors, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { StatsCardSurface } from './StatsCardSurface';
import { TrendBars } from './TrendBars';
import { trendMonthLabel } from './trendLabels';

const RANGES = [3, 6, 12] as const;

/**
 * Flutter `TrendCard`: ödeme geçmişi varsa 3/6/12 ay seçici ve sütun grafiği; yoksa yalnızca bu ayın
 * tahmini ve bir ipucu. Geçmiş olmayan aylara bugünkü tahmini yazmak tarihsel harcama gibi görünmesin diye yapılmaz.
 */
export function TrendCard({
  trend,
  currency,
  months,
  hasPaymentHistory,
  monthly,
  now,
  onMonthsChanged,
}: {
  trend: number[];
  currency: string;
  months: number;
  hasPaymentHistory: boolean;
  monthly: Money;
  now: Date;
  onMonthsChanged: (months: number) => void;
}) {
  const values = hasPaymentHistory ? trend : [monthly.minorUnits];
  const currentTotal = Money.fromMinorUnits(values[values.length - 1]);
  const month = trendMonthLabel(now);
  return (
    <StatsCardSurface>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={textStyle('cardTitle')}>{hasPaymentHistory ? 'Ödeme geçmişi' : 'Aylık gider tahmini'}</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>
            {hasPaymentHistory ? 'Kaydedilen ödemeler' : 'Aktif aboneliklerinin aylık toplamı'}
          </Text>
        </View>
        {hasPaymentHistory ? <RangeSelector months={months} onChange={onMonthsChanged} /> : null}
      </View>

      <View style={styles.totalRow}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, flex: 1 })}>
          {hasPaymentHistory ? `${month} toplamı` : `${month} tahmini`}
        </Text>
        <Text style={textStyle('topBarTitle', { color: colors.primary })}>{formatCurrency(currentTotal, currency)}</Text>
      </View>

      <View style={styles.bars}>
        <TrendBars values={values} hasPaymentHistory={hasPaymentHistory} now={now} />
      </View>

      {hasPaymentHistory ? null : (
        <View style={styles.hint}>
          <MaterialIcons name="info-outline" size={sizes.hintIcon + 1} color={colors.onSurfaceVariant} />
          <Text style={textStyle('chip', { color: colors.onSurfaceVariant, marginLeft: spacing.xs, flex: 1 })}>
            Geçmiş ödemeleri görüntülemek için abonelik ayrıntılarından ödeme kaydı ekle.
          </Text>
        </View>
      )}
    </StatsCardSurface>
  );
}

/** 3 / 6 / 12 ay seçici: seçili seçenek primary dolgulu ve kalın (Flutter `TrendRangeSelector`). */
function RangeSelector({ months, onChange }: { months: number; onChange: (months: number) => void }) {
  return (
    <View style={styles.selector}>
      {RANGES.map((range) => {
        const selected = range === months;
        return (
          <Pressable
            key={range}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(range)}
            style={[styles.option, selected ? styles.optionSelected : null]}
          >
            <Text style={textStyle('badge', { color: selected ? colors.onPrimary : colors.onSurfaceVariant })}>{`${range} Ay`}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xxs / 2 + 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerHighest,
  },
  option: {
    paddingHorizontal: spacing.sm - spacing.xxs / 2,
    paddingVertical: spacing.xs - spacing.xxs / 2,
    borderRadius: radius.pill,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bars: {
    height: sizes.trendHeight,
    marginTop: spacing.xs,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.chip,
    backgroundColor: withAlpha(colors.surfaceContainerHighest, 0.6),
  },
});
