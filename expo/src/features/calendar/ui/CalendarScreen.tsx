import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { WEEKDAY_SHORT, formatLongDate, formatMonthYear } from '../../../core/format/date';
import { type CivilDate, civilDate, deviceTimeZone, dayNumber, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { BILLING_CYCLE_LABELS, type Subscription } from '../../subscriptions/domain/subscription';
import {
  monthGrid,
  monthTotalsByCurrency,
  renewalDaysInMonth,
  renewalsOnDay,
  shiftMonth,
  trialDaysInMonth,
  trialsOnDay,
} from '../domain/calendarDays';

/** Takvim (Flutter `CalendarScreen` karşılığı): aylık ızgara, gün detayı, ay toplamları. */
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
      : (query.data ?? []).length === 0
        ? {
            status: 'empty',
            title: 'Takvimde gösterilecek yenileme yok',
            description: 'Abonelik eklediğinde yenileme ve deneme günleri burada görünür.',
          }
        : { status: 'ready', data: query.data ?? [] };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={textStyle('headline')}>Takvim</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(subscriptions) => <Month subscriptions={subscriptions} today={today} />}
      </AsyncStateView>
    </View>
  );
}

function Month({ subscriptions, today }: { subscriptions: Subscription[]; today: CivilDate }) {
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<CivilDate>(today);

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);
  const renewalDays = useMemo(() => renewalDaysInMonth(subscriptions, today, view.year, view.month), [subscriptions, today, view]);
  const trialDays = useMemo(() => trialDaysInMonth(subscriptions, view.year, view.month), [subscriptions, view]);
  const totals = useMemo(() => monthTotalsByCurrency(subscriptions, today, view.year, view.month), [subscriptions, today, view]);

  function move(delta: number) {
    const next = shiftMonth(view.year, view.month, delta);
    setView(next);
    setSelected(civilDate(next.year, next.month, 1));
  }

  const dayRenewals = renewalsOnDay(subscriptions, today, selected);
  const dayTrials = trialsOnDay(subscriptions, selected);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.monthBar}>
        <IconButton icon="chevron-left" label="Önceki ay" onPress={() => move(-1)} />
        <Text style={textStyle('title')}>{formatMonthYear(view.year, view.month)}</Text>
        <IconButton icon="chevron-right" label="Sonraki ay" onPress={() => move(1)} />
      </View>

      <View style={styles.weekdays}>
        {WEEKDAY_SHORT.map((label) => (
          <Text key={label} style={[textStyle('caption', { color: colors.onSurfaceVariant }), styles.weekday]}>
            {label}
          </Text>
        ))}
      </View>

      {chunk(cells, 7).map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((cell, index) => {
            if (!cell) return <View key={index} style={styles.cell} />;
            const day = cell.date;
            const isSelected = dayNumber(day) === dayNumber(selected);
            const isToday = dayNumber(day) === dayNumber(today);
            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={formatLongDate(day)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(day)}
                style={[styles.cell, isSelected && styles.cellSelected]}
              >
                <Text style={textStyle('label', { color: isToday ? colors.primary : colors.onSurface })}>{day.day}</Text>
                <View style={styles.dots}>
                  {renewalDays.has(day.day) ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                  {trialDays.has(day.day) ? <View style={[styles.dot, { backgroundColor: statusColors.trial }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <Spacer size={spacing.md} />

      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Bu ayın yenilemeleri</Text>
        <MonthTotals totals={totals} />
      </View>

      <Spacer size={spacing.lg} />
      <Text style={textStyle('title')}>{formatLongDate(selected)}</Text>
      <Spacer size={spacing.xs} />

      {dayRenewals.length === 0 && dayTrials.length === 0 ? (
        <View style={styles.card}>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Bu gün için yenileme yok.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {dayRenewals.map((subscription) => (
            <EventRow
              key={`renewal-${subscription.id}`}
              subscription={subscription}
              kind={subscription.billingCycle === 'yearly' ? 'Yıllık yenileme' : 'Yenileme'}
              tone={colors.primary}
            />
          ))}
          {dayTrials.map((subscription) => (
            <EventRow key={`trial-${subscription.id}`} subscription={subscription} kind="Deneme bitişi" tone={statusColors.trial} />
          ))}
        </View>
      )}

      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function MonthTotals({ totals }: { totals: Map<string, Money> }) {
  if (totals.size === 0) return <Text style={textStyle('titleSmall', { color: colors.onSurfaceVariant })}>—</Text>;
  return (
    <View style={styles.totals}>
      {[...totals.entries()].map(([currency, money]) => (
        <Text key={currency} style={textStyle('titleSmall')}>
          {formatCurrency(money, currency)}
        </Text>
      ))}
    </View>
  );
}

function EventRow({ subscription, kind, tone }: { subscription: Subscription; kind: string; tone: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/subscriptions/${subscription.id}` as Href)}
      style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
    >
      <View style={[styles.eventBar, { backgroundColor: tone }]} />
      <View style={styles.eventText}>
        <Text style={textStyle('titleSmall')}>{subscription.name}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          {kind} · {BILLING_CYCLE_LABELS[subscription.billingCycle]}
        </Text>
      </View>
      <Text style={textStyle('titleSmall', { color: colors.primary })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
    </Pressable>
  );
}

function IconButton({ icon, label, onPress }: { icon: 'chevron-left' | 'chevron-right'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <MaterialIcons name={icon} size={24} color={colors.onBackground} />
    </Pressable>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  header: {
    paddingHorizontal: screenGutter,
  },
  content: {
    paddingHorizontal: screenGutter,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minHeight: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.small,
  },
  cellSelected: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xxs,
    height: spacing.xs,
    alignItems: 'center',
  },
  dot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radius.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xxs,
  },
  totals: {
    gap: spacing.xxs,
  },
  list: {
    gap: spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  eventBar: {
    width: spacing.xxs,
    alignSelf: 'stretch',
    borderRadius: radius.xs,
  },
  eventText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
