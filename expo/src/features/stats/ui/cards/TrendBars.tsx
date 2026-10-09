import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { trendMonthLabel } from './trendLabels';

/**
 * Flutter `TrendBars`: her değer için bir sütun; en az %8 yükseklik, son sütun geçerli ay (primary).
 * Altı aşan pencerelerde etiketler seyrekleşir ve yazı küçülür.
 */
export function TrendBars({ values, hasPaymentHistory, now }: { values: number[]; hasPaymentHistory: boolean; now: Date }) {
  const max = values.reduce((acc, value) => (value > acc ? value : acc), 1);
  const last = values.length - 1;
  const dense = values.length > 6;
  return (
    <View style={styles.row}>
      {values.map((value, index) => {
        const ratio = value <= 0 ? 0 : Math.min(1, Math.max(0.08, value / max));
        const current = index === last;
        const barColor = current ? colors.primary : hasPaymentHistory ? withAlpha(colors.primary, 0.35) : colors.surfaceContainerHighest;
        const showLabel = !hasPaymentHistory || values.length <= 6 || (index % 2 === 0 && index < last - 2) || index === last;
        const label = showLabel ? trendMonthLabel(new Date(now.getFullYear(), now.getMonth() - (last - index), 1)) : '';
        const labelStyle = current ? textStyle('barLabelStrong') : dense ? textStyle('barLabelDense') : textStyle('barLabel');
        return (
          <View key={index} style={[styles.column, { paddingHorizontal: dense ? spacing.xxs / 2 : spacing.xs }]}>
            <View style={styles.area}>
              <View style={[styles.bar, { height: `${Math.round(ratio * 100)}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[labelStyle, styles.label]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
  },
  area: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: radius.field - 4,
    borderTopRightRadius: radius.field - 4,
  },
  label: {
    marginTop: spacing.sm - spacing.xxs / 2,
    textAlign: 'center',
  },
});
