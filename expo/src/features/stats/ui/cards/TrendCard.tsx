import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { Money } from '../../../../core/domain/money';
import { zoneToday } from '../../../../core/time/calendar';
import { formatCurrency } from '../../../../core/format/money';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { SegmentedControl } from '../../../../shared/widgets/SegmentedControl';
import { PrimaryButton } from '../../../../shared/widgets/PrimaryButton';
import { trendSummary } from '../../domain/chartSummary';
import { trendState } from '../../domain/trendState';
import { StatsCardSurface } from './StatsCardSurface';
import { TrendBars } from './TrendBars';
import { trendMonthLabel } from './trendLabels';

const RANGE_OPTIONS = [
  { value: '3', label: '3 ay' },
  { value: '6', label: '6 ay' },
  { value: '12', label: '12 ay' },
] as const;

/**
 * Flutter `TrendCard`: ödeme geçmişi varsa 3/6/12 ay seçici ve sütun grafiği; yoksa yalnızca bu ayın
 * tahmini ve bir ipucu. Dokunulan sütun seçilir; toplam satırı seçili ayı gösterir. Hiç ödeme yoksa grafik
 * yerine açıklama ve "Abonelik ekle" çıkar; tek ayda ödeme varsa karşılaştırma uyarısı gösterilir.
 */
export function TrendCard({
  trend,
  currency,
  months,
  hasPaymentHistory,
  monthly,
  now,
  timeZone,
  onMonthsChanged,
}: {
  trend: number[];
  currency: string;
  months: number;
  hasPaymentHistory: boolean;
  monthly: Money;
  now: Date;
  timeZone: string;
  onMonthsChanged: (months: number) => void;
}) {
  useThemeRevision();
  const router = useRouter();
  const values = hasPaymentHistory ? trend : [monthly.minorUnits];
  const last = values.length - 1;
  const [selected, setSelected] = useState(last);
  const index = Math.min(selected, last);
  const state = trendState(values);

  const formatValue = (minorUnits: number) => formatCurrency(Money.fromMinorUnits(minorUnits), currency);
  const current = zoneToday(timeZone, now);
  const monthAt = (position: number) => trendMonthLabel(new Date(Date.UTC(current.year, current.month - 1 - (last - position), 1)));
  const peak = values.reduce((best, value, position) => (value > values[best] ? position : best), 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const summary = trendSummary({
    periodLabel: values.length === 1 ? 'Bu ay' : `Son ${values.length} ay`,
    totalText: formatValue(total),
    peakMonth: values[peak] > 0 ? monthAt(peak) : null,
  });

  return (
    <StatsCardSurface>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={textStyle('bodyStrong')}>{hasPaymentHistory ? 'Ödeme geçmişi' : 'Aylık gider tahmini'}</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xxs / 2 })}>
            {hasPaymentHistory ? 'Kaydedilen ödemeler' : 'Aktif aboneliklerinin aylık toplamı'}
          </Text>
        </View>
      </View>
      {hasPaymentHistory ? (
        <View style={styles.range}>
          <SegmentedControl
            options={RANGE_OPTIONS}
            value={String(months) as (typeof RANGE_OPTIONS)[number]["value"]}
            onChange={(next) => onMonthsChanged(Number(next))}
            accessibilityLabel="Grafik dönemi"
          />
        </View>
      ) : null}

      <View style={styles.totalRow} accessible accessibilityLabel={summary}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, flex: 1 })}>
          {`${monthAt(index)} ${hasPaymentHistory ? 'toplamı' : 'tahmini'}`}
        </Text>
        <Text style={textStyle('heading', { color: colors.primary })}>{formatValue(values[index])}</Text>
      </View>

      {state === 'empty' ? (
        <View style={styles.empty}>
          <MaterialIcons name="bar-chart" size={sizes.emptyStateIcon} color={colors.onSurfaceVariant} />
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs })}>
            Bu dönemde gösterilecek ödeme yok.
          </Text>
          <View style={styles.emptyAction}>
            <PrimaryButton label="Abonelik ekle" icon="add" tall={false} onPress={() => router.push('/subscriptions/add')} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.axis} accessible={false} importantForAccessibility="no-hide-descendants">
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{formatValue(Math.max(...values))}</Text>
            <View style={styles.axisLine} />
          </View>
          <View style={styles.bars}>
            <TrendBars
              values={values}
              hasPaymentHistory={hasPaymentHistory}
              now={now}
              timeZone={timeZone}
              selectedIndex={index}
              onSelect={setSelected}
              formatValue={formatValue}
            />
          </View>
          {hasPaymentHistory ? (
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
              {`Aylık ortalama ${formatValue(Math.round(total / values.length))}. Bir sütuna dokunarak ayı seç.`}
            </Text>
          ) : null}
          {state === 'single' && hasPaymentHistory ? (
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
              Karşılaştırma için en az iki ayda ödeme gerekir.
            </Text>
          ) : null}
        </>
      )}

      {hasPaymentHistory ? null : (
        <View style={styles.hint}>
          <MaterialIcons name="info-outline" size={sizes.hintIcon + 1} color={colors.onSurfaceVariant} />
          <Text style={textStyle('caption', { marginLeft: spacing.xs, flex: 1 })}>
            Geçmiş ödemeleri görüntülemek için abonelik ayrıntılarından ödeme kaydı ekle.
          </Text>
        </View>
      )}
    </StatsCardSurface>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  range: {
    marginTop: spacing.md,
  },
  axis: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  axisLine: {
    flex: 1,
    height: borderWidth.hairline,
    backgroundColor: colors.border,
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
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
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
}));
