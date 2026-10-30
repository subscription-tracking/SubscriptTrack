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

const MAX_ENTRIES = 6;
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const IDENTITY_SIZE = 36;

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

/**
 * Zaman çizelgesi: solda gün ve ay, ortada dikey çizgi üstünde nokta, sağda ikon kutulu satır. Yakın günler
 * mor, "Daha sonra" bölümü gri noktalıdır; satırlar ince çizgiyle ayrılır.
 */
function TimelineList({ items, onOpen, muted = false }: { items: TimelineItem[]; onOpen: (id: string) => void; muted?: boolean }) {
  return <View style={styles.timeline}>
    {items.map(({ day, entry, firstOfDay }, index) => {
      const amount = amountFor(entry);
      const date = `${day.date.day} ${MONTHS[day.date.month - 1]}`;
      const status = entry.kind === 'trialEnd' ? 'Deneme bitiyor' : day.dayOffset === 1 ? 'Yarın' : `${day.dayOffset} gün sonra`;
      const amountLabel = amount ? entry.kind === 'trialEnd' ? `Deneme sonrası ${amount}` : amount : 'Deneme sonrası ücret bilinmiyor';
      const last = index === items.length - 1;
      return <View key={`${day.dayOffset}-${entry.kind}-${entry.subscription.id}`} style={styles.timelineRow}>
        <View style={styles.date}>
          {firstOfDay ? <><Text style={textStyle('title')}>{String(day.date.day).padStart(2, '0')}</Text><Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{MONTHS[day.date.month - 1]}</Text></> : null}
        </View>
        <View style={styles.rail} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={[styles.line, index === 0 && styles.invisible]} />
          <View style={firstOfDay ? [styles.marker, muted && styles.markerMuted] : styles.lineBridge} />
          <View style={[styles.line, last && styles.invisible]} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${entry.subscription.name}, ${date}, ${status}, ${amountLabel}`} onPress={() => onOpen(entry.subscription.id)} style={[styles.row, !last && styles.rowDivider]}>
          <ServiceIdentity name={entry.subscription.name} category={entry.subscription.category} size={IDENTITY_SIZE} compact />
          <View style={styles.content}>
            <Text style={textStyle('bodyStrong')}>{entry.subscription.name}</Text>
            <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{status}</Text>
            {entry.kind === 'trialEnd' ? <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{amountLabel}</Text> : null}
          </View>
          {amount && entry.kind !== 'trialEnd' ? <Text style={textStyle('heading', { fontVariant: ['tabular-nums'] })}>{amount}</Text> : null}
          <Ionicons name="chevron-forward" size={sizes.chevronIcon} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>;
    })}
  </View>;
}

export function UpcomingTimeline({ days, later = [], onOpen, onAll, onCalendar, filterLabel, onClearFilter }: {
  days: readonly UpcomingDay[]; later?: readonly UpcomingDay[]; onOpen: (id: string) => void; onAll: () => void;
  onCalendar: () => void;
  /** Gün şeridinden bir güne süzülmüşse o günün adı; süzgeç yoksa `undefined`. */
  filterLabel?: string; onClearFilter?: () => void;
}) {
  useThemeRevision();
  const upcoming = selectEntries(days);
  const future = selectEntries(later);
  return <View>
    <View style={styles.headerLine}>
      <Text accessibilityRole="header" style={textStyle('title')}>{filterLabel ? 'Seçili gün' : 'Yaklaşan ödemeler'}</Text>
      {filterLabel ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${filterLabel} süzgecini kaldır`} onPress={onClearFilter} style={styles.headerAction}>
          <Text style={textStyle('label', { color: colors.primary })}>{`${filterLabel} ✕`}</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Takvim" onPress={onCalendar} style={styles.headerAction}>
          <Text style={textStyle('label', { color: colors.primary })}>Takvim ›</Text>
        </Pressable>
      )}
    </View>
    {upcoming.items.length ? <TimelineList items={upcoming.items} onOpen={onOpen} /> : <Text style={[textStyle('bodySmall'), styles.empty]}>Önümüzdeki 14 günde ödeme yok.</Text>}
    {upcoming.hidden ? <TextLink label="Tümünü gör ›" onPress={onAll} /> : null}
    {future.items.length ? <View style={styles.later}>
      <Text accessibilityRole="header" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Daha sonra</Text>
      <TimelineList items={future.items} onOpen={onOpen} muted />
      {future.hidden ? <TextLink label="Tümünü gör ›" onPress={onAll} /> : null}
    </View> : null}
  </View>;
}

const styles = themedStyles(() => StyleSheet.create({
  headerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAction: { minHeight: sizes.minTouchTarget, justifyContent: 'center' },
  timeline: { marginTop: gaps.sectionInner },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  date: { width: sizes.timelineDateWidth, paddingTop: spacing.sm },
  rail: { width: spacing.md, alignItems: 'center' },
  line: { flex: 1, width: borderWidth.hairline, backgroundColor: colors.border },
  marker: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.primary },
  markerMuted: { backgroundColor: colors.controlBorder },
  lineBridge: { width: borderWidth.hairline, height: spacing.sm, backgroundColor: colors.border },
  invisible: { opacity: 0 },
  row: { minHeight: 60, flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.sm },
  rowDivider: { borderBottomWidth: borderWidth.hairline, borderBottomColor: colors.border },
  content: { flex: 1, minWidth: 0, gap: spacing.xxs },
  later: { marginTop: spacing.md },
  empty: { marginTop: gaps.sectionInner },
}));
