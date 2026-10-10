import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { useGrowIn } from '../../../../shared/widgets/useGrowIn';
import { trendMonthLabel } from './trendLabels';

/**
 * Flutter `TrendBars` (sütunlar): her değer için bir sütun; en az %8 yükseklik. Dokunulan sütun seçilir ve
 * tutarı üstünde görünür. Sütunlar ilk girişte sırayla büyür. Altı aşan pencerelerde etiketler seyrekleşir.
 */
export function TrendBars({
  values,
  hasPaymentHistory,
  now,
  selectedIndex,
  onSelect,
  formatValue,
}: {
  values: number[];
  hasPaymentHistory: boolean;
  now: Date;
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Minör birimdeki değeri para birimi biçimine çevirir. */
  formatValue: (minorUnits: number) => string;
}) {
  const max = values.reduce((acc, value) => (value > acc ? value : acc), 1);
  const last = values.length - 1;
  const dense = values.length > 6;
  const grow = useGrowIn(values.length);
  const monthAt = (index: number) => trendMonthLabel(new Date(now.getFullYear(), now.getMonth() - (last - index), 1));

  return (
    <View style={styles.row}>
      {values.map((value, index) => {
        const ratio = value <= 0 ? 0 : Math.min(1, Math.max(0.08, value / max));
        const selected = index === selectedIndex;
        const barColor = selected ? colors.primary : hasPaymentHistory ? withAlpha(colors.primary, 0.35) : colors.surfaceContainerHighest;
        const showLabel = !hasPaymentHistory || values.length <= 6 || (index % 2 === 0 && index < last - 2) || index === last;
        const label = showLabel ? monthAt(index) : '';
        const labelStyle = selected ? textStyle('barLabelStrong') : dense ? textStyle('barLabelDense') : textStyle('barLabel');
        const height = grow[index].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(ratio * 100)}%`] });
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`${monthAt(index)}, ${formatValue(value)}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(index)}
            style={[styles.column, { paddingHorizontal: dense ? spacing.xxs / 2 : spacing.xs }]}
          >
            <View style={styles.valueSlot}>
              {selected ? (
                <Text style={textStyle('barLabelStrong', { textAlign: 'center' })} numberOfLines={1}>
                  {formatValue(value)}
                </Text>
              ) : null}
            </View>
            <View style={styles.area}>
              <Animated.View style={[styles.bar, { height, backgroundColor: barColor }]} />
            </View>
            <Text style={[labelStyle, styles.label]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
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
  valueSlot: {
    height: spacing.md,
    justifyContent: 'flex-end',
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
