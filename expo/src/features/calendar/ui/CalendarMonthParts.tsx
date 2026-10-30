import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { formatCurrency } from '../../../core/format/money';
import { orderCurrencies } from '../../../core/domain/moneyByCurrency';
import { formatMonthYear } from '../../../core/format/date';
import { dayNumber, type CivilDate } from '../../../core/time/calendar';
import { colors, sizes, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { CalendarDayCell } from './CalendarDayCell';
import type { useCalendarMonth } from './useCalendarMonth';
import { styles } from './calendarStyles';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'] as const;
type Model = ReturnType<typeof useCalendarMonth>;

export function MonthHeader({ model }: { model: Model }) {
  useThemeRevision();
  const { view, totals, move, goToday } = model;
  return (
      <View style={styles.monthBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Önceki ay" onPress={() => move(-1)} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={sizes.calendarNavIcon} color={colors.onSurface} />
        </Pressable>
        <View style={styles.monthTitle}>
          <Text style={textStyle('bodyStrong', { textAlign: 'center' })}>{formatMonthYear(view.year, view.month)}</Text>
          {orderCurrencies(totals.keys()).map((currency) => [currency, totals.get(currency)!] as const).map(([currency, money]) => (
            <Text key={currency} style={textStyle('bodySmall', { color: colors.primary, textAlign: 'center' })}>
              {`${formatCurrency(money, currency)} bu ay`}
            </Text>
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Bugüne git" onPress={goToday} style={styles.navButton} hitSlop={0}>
          <MaterialIcons name="today" size={sizes.calendarNavIcon} color={colors.primary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sonraki ay" onPress={() => move(1)} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={sizes.calendarNavIcon} color={colors.onSurface} />
        </Pressable>
      </View>

  );
}

export function MonthGrid({ model, today }: { model: Model; today: CivilDate }) {
  useThemeRevision();
  const { weeks, selected, renewalDays, trialDays, isUrgent, isOverdue, setSelected } = model;
  return (<>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((label) => (
          <View key={label} style={styles.weekdayCell} accessible accessibilityRole="text" accessibilityLabel={weekdayLongName(label)}>
            <Text style={textStyle('label', { textAlign: 'center' })}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((cell) => {
              const isSelected = selected !== null && dayNumber(cell.date) === dayNumber(selected);
              const hasRenewal = cell.inMonth && renewalDays.has(cell.day);
              const hasTrial = cell.inMonth && trialDays.has(cell.day);
              const hasEvent = hasRenewal || hasTrial;
              return (
                <CalendarDayCell
                  key={`${cell.date.year}-${cell.date.month}-${cell.date.day}`}
                  day={cell.day}
                  date={cell.date}
                  inMonth={cell.inMonth}
                  isToday={dayNumber(cell.date) === dayNumber(today)}
                  isSelected={isSelected}
                  hasRenewal={hasRenewal}
                  hasTrial={hasTrial}
                  isUrgent={cell.inMonth && hasEvent && isUrgent(cell.day)}
                  isOverdue={cell.inMonth && hasRenewal && isOverdue(cell.day)}
                  onPress={() => setSelected(cell.date)}
                />
              );
            })}
          </View>
        ))}
      </View>

  </>);
}

export function CalendarLegend() {
  useThemeRevision();
  return (
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Yenileme</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDiamond, { backgroundColor: statusColors.trial }]} />
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Deneme bitişi</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>3 gün içinde</Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialIcons name="error" size={sizes.calendarDot + 4} color={colors.error} />
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Gecikmiş</Text>
        </View>
      </View>

  );
}

function weekdayLongName(label: (typeof WEEKDAYS)[number]): string {
  switch (label) {
    case 'Pt': return 'Pazartesi';
    case 'Sa': return 'Salı';
    case 'Ça': return 'Çarşamba';
    case 'Pe': return 'Perşembe';
    case 'Cu': return 'Cuma';
    case 'Ct': return 'Cumartesi';
    case 'Pz': return 'Pazar';
  }
}

