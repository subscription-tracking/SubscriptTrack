import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '../../../core/format/money';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { borderWidth, colors, gaps, radius, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { TextLink } from '../../../shared/widgets/TextLink';
import { type UpcomingDay, type UpcomingEntry } from '../domain/homeSummary';
import { upcomingDayLabel } from '../domain/dayLabel';
import { ReminderHint } from './NextPaymentCards';
import { SectionHeader } from './SectionHeader';
import { SubscriptionRowCard } from './SubscriptionRowCard';

const MAX_DAYS = 6;

function entryAmount(entry: UpcomingEntry): string {
  const { subscription } = entry;
  const money = entry.kind === 'trialEnd' ? (subscription.trialPriceAfter ?? subscription.amount) : subscription.amount;
  return formatCurrency(money, subscription.currency);
}

/** "Önümüzdeki 14 gün": yenileme ve deneme bitişleri günlere gruplu; en fazla 6 gün grubu. */
export function UpcomingTimeline({
  days,
  onOpen,
  onCalendar,
  onAll,
  onReminders,
}: {
  days: readonly UpcomingDay[];
  onOpen: (id: string) => void;
  onCalendar: () => void;
  onAll: () => void;
  onReminders: () => void;
}) {
  useThemeRevision();
  return (
    <View>
      <SectionHeader title="Önümüzdeki 14 gün" action="Takvim" onAction={onCalendar} />
      {days.length === 0 ? (
        <View style={styles.empty}>
          <Text style={textStyle('bodySmall')}>Önümüzdeki 14 günde ödeme yok.</Text>
        </View>
      ) : (
        days.slice(0, MAX_DAYS).map((day) => (
          <View key={day.dayOffset} style={styles.group}>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginBottom: gaps.hint })}>
              {upcomingDayLabel(day.date, day.dayOffset)}
            </Text>
            <View style={styles.list}>
              {day.entries.map((entry) => (
                <SubscriptionRowCard
                  key={`${entry.kind}-${entry.subscription.id}`}
                  subscription={entry.subscription}
                  subtitle={entry.kind === 'trialEnd' ? 'Deneme bitiyor' : `${day.dayOffset} gün kaldı`}
                  onPress={() => onOpen(entry.subscription.id)}
                  trailing={<Text style={textStyle('heading')}>{entryAmount(entry)}</Text>}
                />
              ))}
            </View>
          </View>
        ))
      )}
      {days.length > MAX_DAYS ? <TextLink label="Tümünü gör" onPress={onAll} /> : null}
      {days.length > 0 ? <ReminderHint onPress={onReminders} /> : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  group: { marginTop: gaps.sectionInner },
  list: { gap: gaps.trialCard },
  empty: {
    marginTop: gaps.sectionInner,
    padding: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
}));
