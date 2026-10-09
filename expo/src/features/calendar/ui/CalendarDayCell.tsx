import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderWidth, colors, sizes, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

/**
 * Flutter `CalendarDayCell`: yuvarlak gün hücresi. Seçili gün dolu primary, bugün primary halkalı ve
 * primary yazılıdır. Yenileme noktası 5 px; 3 gün içindekiler hata rengiyle işaretlenir. Önceki ve
 * sonraki ay günleri soluk ve tıklanamazdır.
 */
export function CalendarDayCell({
  day,
  inMonth,
  isToday,
  isSelected,
  hasRenewal,
  isUrgent,
  onPress,
}: {
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasRenewal: boolean;
  isUrgent: boolean;
  onPress: () => void;
}) {
  const background = isSelected ? colors.primary : isToday ? withAlpha(colors.primary, 0.16) : undefined;
  const textColor = isSelected ? colors.onPrimary : isToday ? colors.primary : inMonth ? colors.onSurface : colors.outline;
  const dotColor = isSelected ? colors.onPrimary : isUrgent ? colors.error : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day}${hasRenewal ? ', yenileme var' : ''}`}
      accessibilityState={{ selected: isSelected, disabled: !inMonth }}
      disabled={!inMonth}
      onPress={onPress}
      style={styles.cellBox}
    >
      <View
        style={[
          styles.circle,
          background ? { backgroundColor: background } : null,
          isToday && !isSelected ? { borderWidth: borderWidth.regular, borderColor: withAlpha(colors.primary, 0.4) } : null,
        ]}
      >
        <Text style={textStyle(isToday || isSelected ? 'bodyMediumStrong' : 'bodySmall', { color: textColor })}>{String(day)}</Text>
        {hasRenewal ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cellBox: {
    flex: 1,
    margin: sizes.calendarCellInset,
    height: sizes.calendarCell,
  },
  circle: {
    flex: 1,
    borderRadius: sizes.calendarCell / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    bottom: sizes.calendarDotBottom,
    width: sizes.calendarDot,
    height: sizes.calendarDot,
    borderRadius: sizes.calendarDot / 2,
  },
});
