import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCurrency } from '../../../core/format/money';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TextLink } from '../../../shared/widgets/TextLink';
import { ServiceIdentity } from '../../subscriptions/ui/ServiceIdentity';
import { type UpcomingDay, type UpcomingEntry } from '../domain/homeSummary';
import { ReminderHint } from './NextPaymentCards';
import { SectionHeader } from './SectionHeader';

const MAX_ENTRIES = 6;
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

type TimelineItem = { day: UpcomingDay; entry: UpcomingEntry; firstOfDay: boolean };
function selectEntries(days: readonly UpcomingDay[]) {
  const all: TimelineItem[] = days.flatMap((day) => day.entries.map((entry, index) => ({ day, entry, firstOfDay: index === 0 })));
  return { items: all.slice(0, MAX_ENTRIES), hidden: all.length > MAX_ENTRIES };
}
function amountFor(entry: UpcomingEntry): string | null {
  const { subscription } = entry;
  const amount = entry.kind === 'trialEnd' ? subscription.trialPriceAfter : subscription.amount;
  return amount == null ? null : formatCurrency(amount, subscription.currency);
}
function TimelineList({ items, onOpen }: { items: TimelineItem[]; onOpen: (id: string) => void }) {
  return <View style={styles.timeline}>
    {items.map(({ day, entry, firstOfDay }, index) => {
      const amount = amountFor(entry);
      const date = `${day.date.day} ${MONTHS[day.date.month - 1]}`;
      const status = entry.kind === 'trialEnd' ? 'Deneme bitiyor' : day.dayOffset === 1 ? 'Yarın yenileniyor' : `${day.dayOffset} gün sonra yenileniyor`;
      const amountLabel = amount ? entry.kind === 'trialEnd' ? `Deneme sonrası ${amount}` : amount : 'Deneme sonrası ücret bilinmiyor';
      return <View key={`${day.dayOffset}-${entry.kind}-${entry.subscription.id}`} style={styles.timelineRow}>
        <View style={styles.date}>
          {firstOfDay ? <><Text style={textStyle('title')}>{String(day.date.day).padStart(2, '0')}</Text><Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{MONTHS[day.date.month - 1]}</Text></> : null}
        </View>
        <View style={styles.rail} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={[styles.line, index === 0 && styles.invisible]} />
          <View style={firstOfDay ? styles.marker : styles.lineBridge} />
          <View style={[styles.line, index === items.length - 1 && styles.invisible]} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${entry.subscription.name}, ${date}, ${status}, ${amountLabel}`} onPress={() => onOpen(entry.subscription.id)} style={styles.row}>
          <ServiceIdentity name={entry.subscription.name} category={entry.subscription.category} size={sizes.timelineIdentitySize} compact />
          <View style={styles.content}>
            <View style={styles.titleLine}>
              <Text style={textStyle('bodyStrong', { flexGrow: 1, flexShrink: 1 })}>{entry.subscription.name}</Text>
              {amount && entry.kind !== 'trialEnd' ? <Text style={textStyle('numeric')}>{amount}</Text> : null}
            </View>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{status}</Text>
            {entry.kind === 'trialEnd' ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{amountLabel}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={sizes.chevronIcon} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>;
    })}
  </View>;
}

export function UpcomingTimeline({ days, later = [], onOpen, onCalendar, onAll, onReminders }: {
  days: readonly UpcomingDay[]; later?: readonly UpcomingDay[]; onOpen: (id: string) => void;
  onCalendar: () => void; onAll: () => void; onReminders: () => void;
}) {
  useThemeRevision();
  const upcoming = selectEntries(days);
  const future = selectEntries(later);
  return <View>
    <SectionHeader title="Yaklaşan ödemeler" action="Takvim" onAction={onCalendar} />
    <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>14 gün içinde</Text>
    {upcoming.items.length ? <TimelineList items={upcoming.items} onOpen={onOpen} /> : <Text style={[textStyle('bodySmall'), styles.empty]}>Önümüzdeki 14 günde ödeme yok.</Text>}
    {upcoming.hidden ? <TextLink label="Tümünü gör" onPress={onAll} /> : null}
    {future.items.length ? <View style={styles.later}>
      <Text accessibilityRole="header" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Daha sonra</Text>
      <TimelineList items={future.items} onOpen={onOpen} />
      {future.hidden ? <TextLink label="Tümünü gör" onPress={onAll} /> : null}
    </View> : null}
    {days.length > 0 ? <ReminderHint onPress={onReminders} /> : null}
  </View>;
}

const styles = themedStyles(() => StyleSheet.create({
  timeline: { marginTop: gaps.sectionInner },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  date: { width: sizes.timelineDateWidth, paddingTop: spacing.sm },
  rail: { width: sizes.timelineRailWidth, alignItems: 'center' },
  line: { flex: 1, width: borderWidth.hairline, backgroundColor: colors.border },
  marker: { width: sizes.timelineMarkerSize, height: sizes.timelineMarkerSize, borderRadius: radius.pill, backgroundColor: colors.primary },
  lineBridge: { width: borderWidth.hairline, height: sizes.timelineMarkerSize, backgroundColor: colors.border },
  invisible: { opacity: 0 },
  row: { minHeight: sizes.minTouchTarget, flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.sm },
  content: { flex: 1, minWidth: 0, gap: spacing.xxs },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.xs },
  later: { marginTop: spacing.md },
  empty: { marginTop: gaps.sectionInner },
}));
