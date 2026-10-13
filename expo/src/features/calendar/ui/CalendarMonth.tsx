import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import type { CivilDate } from '../../../core/time/calendar';
import type { Subscription } from '../../subscriptions/domain/subscription';
import { formatDateParam } from '../domain/calendarDateParam';
import { useCalendarMonth } from './useCalendarMonth';
import { MonthHeader, MonthGrid, CalendarLegend } from './CalendarMonthParts';
import { CalendarEventItem } from './CalendarEventItem';
import { OverdueSection } from './OverdueSection';
import { EmptyDayState } from './EmptyDayState';
import { styles } from './calendarStyles';

export function CalendarMonth({ subscriptions, today }: { subscriptions: Subscription[]; today: CivilDate }) {
  useThemeRevision();
  const router = useRouter();
  const model = useCalendarMonth(subscriptions, today);
  const { selected, dayEvents: allEvents, overdue } = model;
  const overdueIds = new Set(overdue.map((item) => item.id));
  const dayEvents = allEvents.filter((item) => item.isTrial || !overdueIds.has(item.subscription.id));

  return (
    // Küçük ekran ve yatay döndürmede ay ızgarası ile gün listesi birlikte dikey kaydırılır.
    <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <MonthHeader model={model} />
      <MonthGrid model={model} today={today} />
      <CalendarLegend />
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
      </View>

      <OverdueSection subscriptions={overdue} today={today} onOpen={(item) => router.push(`/subscriptions/${item.id}`)} />

      {dayEvents.length === 0 && allEvents.length > 0 ? null : dayEvents.length === 0 ? (
        <EmptyDayState
          hasSelection={selected !== null}
          onAddForDay={selected ? () => router.push(`/subscriptions/add?start=${formatDateParam(selected)}`) : undefined}
        />
      ) : (
        <View style={styles.list}>
          {dayEvents.map((item) => (
            <CalendarEventItem
              key={`${item.isTrial ? 'trial' : 'renewal'}-${item.subscription.id}`}
              subscription={item.subscription}
              date={selected ?? today}
              isTrial={item.isTrial}
              onPress={() => router.push(`/subscriptions/${item.subscription.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

