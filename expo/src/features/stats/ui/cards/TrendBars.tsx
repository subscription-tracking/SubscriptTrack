import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { zoneToday } from '../../../../core/time/calendar';
import { textStyle } from '../../../../shared/design/typography';
import { chartColors } from '../../../../shared/design/chartTheme';
import { useGrowIn } from '../../../../shared/widgets/useGrowIn';
import { trendMonthLabel } from './trendLabels';

/**
 * Flutter `TrendBars` (sütunlar): her değer için bir sütun; en az %8 yükseklik. Dokunulan sütun seçilir;
 * seçilen ayın tutarı kartın üstündeki toplam satırında tek kez gösterilir (çubuk üstünde tekrarlanmaz).
 * Değeri olmayan ayın çubuk altında "–" görünür. Sütunlar ilk girişte sırayla büyür. Altı aşan pencerelerde etiketler seyrekleşir.
 */
export function TrendBars({
  values,
  hasPaymentHistory,
  now,
  timeZone,
  selectedIndex,
  onSelect,
  formatValue,
}: {
  values: number[];
  hasPaymentHistory: boolean;
  now: Date;
  timeZone: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Minör birimdeki değeri para birimi biçimine çevirir. */
  formatValue: (minorUnits: number) => string;
}) {
  useThemeRevision();
  const max = values.reduce((acc, value) => (value > acc ? value : acc), 1);
  const last = values.length - 1;
  const dense = values.length > 6;
  const emptyWord = hasPaymentHistory ? 'ödeme yok' : 'tahmin yok';
  const grow = useGrowIn(values.length);
  const current = zoneToday(timeZone, now);
  const monthAt = (index: number) => trendMonthLabel(new Date(Date.UTC(current.year, current.month - 1 - (last - index), 1)));

  return (
    <View style={styles.row}>
      {values.map((value, index) => {
        const ratio = value <= 0 ? 0 : Math.min(1, value / max);
        const selected = index === selectedIndex;
        const barColor = selected ? colors.primary : hasPaymentHistory ? withAlpha(chartColors.chart0, 0.75) : colors.surfaceContainerHighest;
        const showLabel = !hasPaymentHistory || values.length <= 6 || index % 2 === 0 || index === last || selected;
        const label = showLabel ? monthAt(index) : '';
        const labelStyle = selected ? textStyle('captionStrong', { color: colors.primary }) : textStyle('caption');
        const height = grow[index].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${ratio * 100}%`] });
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={value > 0 ? `${monthAt(index)}, ${formatValue(value)}` : `${monthAt(index)}: ${emptyWord}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(index)}
            style={[styles.column, { paddingHorizontal: dense ? spacing.xxs / 2 : spacing.xs }]}
          >
            <View style={styles.area}>
              <Animated.View style={[styles.bar, { height, backgroundColor: barColor }]} />
            </View>
            <Text style={[textStyle('caption'), styles.empty]} accessible={false}>{value <= 0 ? '–' : ' '}</Text>
            <Text style={[labelStyle, styles.label]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
  },
  empty: {
    textAlign: 'center',
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
}));
