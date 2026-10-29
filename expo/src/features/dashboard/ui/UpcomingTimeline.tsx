import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TextLink } from '../../../shared/widgets/TextLink';
import { type UpcomingDay, type UpcomingEntry } from '../domain/homeSummary';
import { ReminderHint } from './NextPaymentCards';
import { SectionHeader } from './SectionHeader';

const MAX_DAYS = 6;
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function entryAmount(entry: UpcomingEntry): string {
  const { subscription } = entry;
  const money = entry.kind === 'trialEnd' ? (subscription.trialPriceAfter ?? subscription.amount) : subscription.amount;
  return formatCurrency(money, subscription.currency);
}

/** "Önümüzdeki 14 gün": yenileme ve deneme bitişleri günlere gruplu; en fazla 6 gün grubu. */
export function UpcomingTimeline({
  days,
  later = [],
  onOpen,
  onCalendar,
  onAll,
  onReminders,
}: {
  days: readonly UpcomingDay[];
  later?: readonly UpcomingDay[];
  onOpen: (id: string) => void;
  onCalendar: () => void;
  onAll: () => void;
  onReminders: () => void;
}) {
  useThemeRevision();
  return (
    <View>
      <SectionHeader title="Yaklaşan ödemeler" action="Takvim" onAction={onCalendar} />
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>14 gün içinde</Text>
      {days.length === 0 ? (
        <View style={styles.empty}>
          <Text style={textStyle('bodySmall')}>Önümüzdeki 14 günde ödeme yok.</Text>
        </View>
      ) : (
        days.slice(0, MAX_DAYS).map((day) => (
          <View key={day.dayOffset} style={styles.group}>
            <View style={styles.date}>
              <Text style={textStyle('numeric')}>{String(day.date.day).padStart(2, '0')}</Text>
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{MONTHS[day.date.month - 1]}</Text>
            </View>
            <View style={styles.list}>
              {day.entries.map((entry) => (
                <Pressable
                  key={`${entry.kind}-${entry.subscription.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.subscription.name}, ${entry.kind === 'trialEnd' ? 'deneme bitiyor' : 'yenileme'}, ${day.dayOffset} gün kaldı, ${entryAmount(entry)}`}
                  onPress={() => onOpen(entry.subscription.id)}
                  style={styles.row}
                >
                  <View style={styles.marker} />
                  <View style={styles.avatar}><Text style={textStyle('bodyStrong', { color: colors.primary })}>{entry.subscription.name.slice(0, 1).toUpperCase()}</Text></View>
                  <View style={styles.details}>
                    <Text style={textStyle('bodyStrong')}>{entry.subscription.name}</Text>
                    {entry.kind === 'trialEnd' ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Deneme bitiyor</Text> : null}
                    <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${day.dayOffset} gün kaldı`}</Text>
                  </View>
                  <Text style={textStyle('numeric', { flexShrink: 1, textAlign: 'right' })}>{entryAmount(entry)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
      {days.length > MAX_DAYS ? <TextLink label="Tümünü gör" onPress={onAll} /> : null}
      {later.length > 0 ? <View style={styles.later}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Daha sonra</Text>
        {later.slice(0, 2).flatMap((day) => day.entries.map((entry) => (
          <Pressable key={`later-${entry.kind}-${entry.subscription.id}`} accessibilityRole="button" accessibilityLabel={`${entry.subscription.name}, ${day.dayOffset} gün sonra, ${entryAmount(entry)}`} onPress={() => onOpen(entry.subscription.id)} style={styles.laterRow}>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${day.date.day} ${MONTHS[day.date.month - 1]}`}</Text>
            <Text style={textStyle('bodyStrong', { flex: 1 })}>{entry.subscription.name}</Text>
            <Text style={textStyle('numeric')}>{entryAmount(entry)}</Text>
          </Pressable>
        )))}
        {later.length > 2 ? <TextLink label="Tümünü gör" onPress={onAll} /> : null}
      </View> : null}
      {days.length > 0 ? <ReminderHint onPress={onReminders} /> : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  group: { marginTop: gaps.sectionInner, flexDirection: 'row', gap: spacing.sm },
  date: { width: 48 },
  list: { flex: 1, borderLeftWidth: borderWidth.hairline, borderLeftColor: colors.border },
  details: { flex: 1, gap: spacing.xxs },
  row: { minHeight: sizes.minTouchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.md },
  marker: { position: 'absolute', left: -5, top: 24, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: radius.medium, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  later: { marginTop: spacing.md },
  laterRow: { minHeight: sizes.minTouchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  empty: {
    marginTop: gaps.sectionInner,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
}));
