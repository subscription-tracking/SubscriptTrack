import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatMonthYear } from '../../../core/format/date';
import { type CivilDate, civilDate, dayNumber, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { monthGrid, monthTotalsByCurrency, renewalDaysInMonth, renewalsOnDay, shiftMonth, trialDaysInMonth, trialsOnDay } from '../domain/calendarDays';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarEventItem } from './CalendarEventItem';
import { EmptyDayState } from './EmptyDayState';

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'] as const;
/** Flutter `_urgentDays`: bugünden itibaren bu kadar gün içindeki günler hata rengiyle işaretlenir. */
const URGENT_WINDOW_DAYS = 3;

interface GridCell {
  day: number;
  date: CivilDate;
  inMonth: boolean;
}

/** Ay ızgarası: önceki ay günleri, bu ayın günleri, sonraki ay günleriyle haftayı tamamlar (Flutter `_cells`). */
function buildCells(year: number, month: number): GridCell[][] {
  const grid = monthGrid(year, month);
  const leading = grid.findIndex((cell) => cell !== null);
  const previous = shiftMonth(year, month, -1);
  const previousDays = new Date(previous.year, previous.month, 0).getDate();
  const cells: GridCell[] = [];
  for (let i = leading - 1; i >= 0; i -= 1) {
    const day = previousDays - i;
    cells.push({ day, date: civilDate(previous.year, previous.month, day), inMonth: false });
  }
  for (const cell of grid) {
    if (cell) cells.push({ day: cell.date.day, date: cell.date, inMonth: true });
  }
  const next = shiftMonth(year, month, 1);
  for (let day = 1; cells.length % 7 !== 0; day += 1) {
    cells.push({ day, date: civilDate(next.year, next.month, day), inMonth: false });
  }
  return chunk(cells, 7);
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/** Takvim (Flutter `CalendarScreen`): ay başlığı ve ay toplamları, ızgara, gün detayı. Takvim pushed bir ekrandır. */
export function CalendarScreen() {
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Takvim yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Takvim" />
      <AsyncStateView state={state}>{(subscriptions) => <Month subscriptions={subscriptions} today={today} />}</AsyncStateView>
    </View>
  );
}

function Month({ subscriptions, today }: { subscriptions: Subscription[]; today: CivilDate }) {
  const router = useRouter();
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<CivilDate | null>(today);

  const weeks = useMemo(() => buildCells(view.year, view.month), [view]);
  const renewalDays = useMemo(() => renewalDaysInMonth(subscriptions, today, view.year, view.month), [subscriptions, today, view]);
  const trialDays = useMemo(() => trialDaysInMonth(subscriptions, view.year, view.month), [subscriptions, view]);
  const totals = useMemo(() => monthTotalsByCurrency(subscriptions, today, view.year, view.month), [subscriptions, today, view]);

  function move(delta: number) {
    setView(shiftMonth(view.year, view.month, delta));
    setSelected(null);
  }

  const dayEvents = selected
    ? [...renewalsOnDay(subscriptions, today, selected).map((subscription) => ({ subscription, isTrial: false })), ...trialsOnDay(subscriptions, selected).map((subscription) => ({ subscription, isTrial: true }))]
    : [];

  function isUrgent(day: number): boolean {
    const diff = dayNumber(civilDate(view.year, view.month, day)) - dayNumber(today);
    return diff >= 0 && diff <= URGENT_WINDOW_DAYS;
  }

  return (
    <View style={styles.body}>
      <View style={styles.monthBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Önceki ay" onPress={() => move(-1)} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={sizes.calendarNavIcon} color={colors.onSurface} />
        </Pressable>
        <View style={styles.monthTitle}>
          <Text style={textStyle('titleSmall', { textAlign: 'center' })}>{formatMonthYear(view.year, view.month)}</Text>
          {[...totals.entries()].map(([currency, money]) => (
            <Text key={currency} style={textStyle('bodySmall', { color: colors.primary, textAlign: 'center' })}>
              {`${formatCurrency(money, currency)} bu ay`}
            </Text>
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sonraki ay" onPress={() => move(1)} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={sizes.calendarNavIcon} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={textStyle('bodySmallStrong', { textAlign: 'center' })}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((cell) => {
              const isSelected = selected !== null && dayNumber(cell.date) === dayNumber(selected);
              const hasEvent = cell.inMonth && (renewalDays.has(cell.day) || trialDays.has(cell.day));
              return (
                <CalendarDayCell
                  key={`${cell.date.year}-${cell.date.month}-${cell.date.day}`}
                  day={cell.day}
                  inMonth={cell.inMonth}
                  isToday={dayNumber(cell.date) === dayNumber(today)}
                  isSelected={isSelected}
                  hasRenewal={hasEvent}
                  isUrgent={cell.inMonth && hasEvent && isUrgent(cell.day)}
                  onPress={() => setSelected(cell.date)}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
      </View>

      {dayEvents.length === 0 ? (
        <EmptyDayState
          hasSelection={selected !== null}
          onAddForDay={selected ? () => router.push(`/subscriptions/add?start=${formatDateParam(selected)}`) : undefined}
        />
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => `${item.isTrial ? 'trial' : 'renewal'}-${item.subscription.id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CalendarEventItem
              subscription={item.subscription}
              isTrial={item.isTrial}
              onPress={() => router.push(`/subscriptions/${item.subscription.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

/** Ekleme ekranına tarih aktarımı için YYYY-AA-GG biçimi. */
export function formatDateParam(day: CivilDate): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${day.year}-${pad(day.month)}-${pad(day.day)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  navButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  week: {
    flexDirection: 'row',
  },
  divider: {
    height: gaps.sectionTop - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dividerLine: {
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: sizes.bottomNavHeight + spacing.xl,
  },
});

