import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tapFeedback } from '../../../shared/haptics';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, radius, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { type StripDay } from '../domain/weekSummary';

const STRIP_HEIGHT = 48;
const MIN_BAR = 4;

function barHeight(day: StripDay, peak: number): number {
  if (day.count === 0) return MIN_BAR;
  return Math.max(MIN_BAR * 3, (day.count / peak) * STRIP_HEIGHT);
}

function dayName(index: number): string {
  return index === 0 ? 'Bugün' : index === 1 ? 'Yarın' : `${index} gün sonra`;
}

/**
 * Önümüzdeki günlerin ödeme yükü: her gün bir çubuk, yükseklik o günün ödeme sayısıdır (para biriminden bağımsız;
 * tutarlar başlıkta gösterilir). Ödemesi olan bir güne dokununca altındaki liste o güne süzülür; aynı çubuğa
 * tekrar dokunmak süzgeci kaldırır. İlk çubuk bugündür.
 */
export function MonthStrip({ days, selected, onSelect }: { days: readonly StripDay[]; selected: number | null; onSelect: (index: number | null) => void }) {
  useThemeRevision();
  const peak = Math.max(2, ...days.map((day) => day.count));
  return (
    <View>
      <View style={styles.bars}>
        {days.map((day, index) => {
          const active = selected === index;
          const dimmed = selected !== null && !active;
          const bar = <View style={[styles.bar, { height: barHeight(day, peak) }, day.count > 0 && styles.barOn, index === 0 && day.count === 0 && styles.today, active && styles.barSelected, dimmed && styles.barDim]} />;
          return day.count === 0 ? (
            <View key={index} style={styles.slot}>{bar}</View>
          ) : (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`${dayName(index)}, ${day.count} ödeme`}
              accessibilityState={{ selected: active }}
              hitSlop={{ top: spacing.xs, bottom: spacing.xs }}
              onPress={() => { tapFeedback(); onSelect(active ? null : index); }}
              style={styles.slot}
            >
              {bar}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={textStyle('caption', { color: colors.primary })}>bugün</Text>
        <Text style={textStyle('caption')}>{`${days.length} gün`}</Text>
      </View>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  bars: { height: STRIP_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxs },
  slot: { flex: 1, height: STRIP_HEIGHT, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.xs, backgroundColor: colors.border },
  barOn: { backgroundColor: colors.primary },
  today: { backgroundColor: colors.onSurface },
  barSelected: { backgroundColor: colors.onSurface },
  barDim: { opacity: 0.35 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xxs },
}));
