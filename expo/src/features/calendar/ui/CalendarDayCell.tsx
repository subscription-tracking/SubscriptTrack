import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatLongDate } from '../../../core/format/date';
import { type CivilDate } from '../../../core/time/calendar';
import { borderWidth, colors, sizes, statusColors, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';

/**
 * Flutter `CalendarDayCell`: yuvarlak gün hücresi. Seçili gün dolu primary, bugün primary halkalı ve
 * primary yazılıdır. İşaretler renge ek olarak biçimle de ayrışır: yenileme dolu daire, deneme bitişi elmas,
 * 3 gün içindeki yenileme hata renginde daire, gecikmiş vade ünlem simgesi. Önceki ve sonraki ay günleri soluk
 * ve tıklanamazdır.
 */
export function CalendarDayCell({
  day,
  date,
  inMonth,
  isToday,
  isSelected,
  hasRenewal,
  hasTrial,
  isUrgent,
  isOverdue = false,
  onPress,
}: {
  day: number;
  date: CivilDate;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasRenewal: boolean;
  hasTrial: boolean;
  isUrgent: boolean;
  /** Yenileme tarihi geçmiş; nokta yerine ünlem simgesi çizilir. */
  isOverdue?: boolean;
  onPress: () => void;
}) {
  useThemeRevision();
  const background = isSelected ? colors.primary : isToday ? withAlpha(colors.primary, 0.16) : undefined;
  const textColor = isSelected ? colors.onPrimary : isToday ? colors.primary : inMonth ? colors.onSurface : colors.outline;
  return (
    <Pressable
      importantForAccessibility={inMonth ? 'yes' : 'no-hide-descendants'}
      accessibilityRole="button"
      accessibilityLabel={`${formatLongDate(date)}${isToday ? ', bugün' : ''}${hasRenewal ? (isOverdue ? ', gecikmiş vade var' : isUrgent ? ', yenileme var, 3 gün içinde' : ', yenileme var') : ''}${hasTrial ? ', deneme bitişi var' : ''}`}
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
        <Text style={textStyle(isToday || isSelected ? 'label' : 'bodySmall', { color: textColor })}>{String(day)}</Text>
        {hasRenewal && isOverdue ? (
          <View style={[styles.overdueMark, { left: '52%' }]}>
            <MaterialIcons name="error" size={sizes.calendarDot + 4} color={isSelected ? colors.onPrimary : colors.error} />
          </View>
        ) : hasRenewal ? (
          <View style={[styles.dot, { left: '58%', backgroundColor: isSelected ? colors.onPrimary : isUrgent ? colors.error : colors.primary }]} />
        ) : null}
        {hasTrial ? <View style={[styles.trialDot, { backgroundColor: statusColors.trial }]} /> : null}
      </View>
    </Pressable>
  );
}

/** Olay işareti 8 dp: önceki 6 dp, küçük ekranda ayırt edilemiyordu. */
const DOT = sizes.calendarDot + 2;

const styles = themedStyles(() => StyleSheet.create({
  cellBox: {
    flex: 1,
    minHeight: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
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
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  overdueMark: {
    position: 'absolute',
    bottom: sizes.calendarDotBottom - 1,
  },
  trialDot: {
    position: 'absolute',
    bottom: sizes.calendarDotBottom,
    left: '20%',
    width: DOT - 1,
    height: DOT - 1,
    transform: [{ rotate: '45deg' }],
  },
}));
