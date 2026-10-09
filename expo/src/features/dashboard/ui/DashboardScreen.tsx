import { useMemo } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { useSavingsQuery } from '../../savings/data/queries';
import { useNotificationsQuery } from '../../notifications/data/queries';
import { unreadCount } from '../../notifications/domain/notificationCenter';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { savingsTotalsByCurrency } from '../../savings/domain/savingsSummary';
import { SubscriptionTile } from '../../subscriptions/ui/SubscriptionTile';
import { renewalLabel } from '../../subscriptions/domain/renewalLabel';
import { type Subscription, daysUntilRenewal } from '../../subscriptions/domain/subscription';
import {
  activeForTotals,
  monthlyTotalsByCurrency,
  nextPayment,
  renewingWithin,
  trialsByEnd,
  yearlyTotalsByCurrency,
} from '../domain/dashboardSummary';

const TRIAL_PREVIEW = 3;

/** Ana sayfa (Flutter `DashboardScreen` karşılığı): toplamlar, çipler, denemeler, sıradaki ödeme. */
export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const all = query.data ?? [];
  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Özet yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : all.length === 0
        ? {
            status: 'empty',
            title: 'Henüz abonelik yok',
            description: 'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.',
            action: <PrimaryButton label="İlk aboneliği ekle" onPress={() => router.push('/subscriptions/add' as Href)} />,
          }
        : { status: 'ready', data: all };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={textStyle('headline')}>Ana sayfa</Text>
        <NotificationsButton />
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(subscriptions) => <Summary subscriptions={subscriptions} today={today} />}
      </AsyncStateView>
    </View>
  );
}

function NotificationsButton() {
  const router = useRouter();
  const { user } = useAuth();
  const notifications = useNotificationsQuery(user?.id);
  const unread = unreadCount(notifications.data ?? []);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'}
      onPress={() => router.push('/notifications' as Href)}
      style={styles.bell}
    >
      <MaterialIcons name="notifications-none" size={24} color={colors.onBackground} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={textStyle('caption', { color: colors.onPrimary })}>{unread > 9 ? '9+' : String(unread)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Summary({ subscriptions, today }: { subscriptions: Subscription[]; today: CivilDate }) {
  const router = useRouter();
  const { user } = useAuth();
  const savings = useSavingsQuery(user?.id);
  const savingsTotals = savingsTotalsByCurrency(savings.data ?? []);
  const active = activeForTotals(subscriptions, today);
  const monthly = monthlyTotalsByCurrency(active);
  const yearly = yearlyTotalsByCurrency(active);
  const dueWeek = renewingWithin(subscriptions, today, 7).length;
  const trials = trialsByEnd(subscriptions);
  const upcoming = nextPayment(subscriptions, today);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Aylık tahmini toplam</Text>
        <TotalsList totals={monthly} />
        <Spacer size={spacing.sm} />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Yıllık tahmini toplam</Text>
        <TotalsList totals={yearly} />
        <Spacer size={spacing.sm} />
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          {active.length} aktif abonelik. Para birimleri ayrı toplanır.
        </Text>
      </View>

      <Spacer size={spacing.md} />

      <View style={styles.chips}>
        <Chip label="Aktif" value={String(active.length)} />
        <Chip label="7 gün içinde" value={String(dueWeek)} />
        <Chip label="Deneme" value={String(trials.length)} />
      </View>

      {savingsTotals.size > 0 ? (
        <>
          <Spacer size={spacing.md} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/savings' as Href)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Kaydedilen yıllık tasarruf</Text>
            {[...savingsTotals.entries()].map(([currency, money]) => (
              <Text key={currency} style={textStyle('titleSmall', { color: colors.primary })}>{formatCurrency(money, currency)}</Text>
            ))}
          </Pressable>
        </>
      ) : null}

      {trials.length > 0 ? (
        <>
          <Spacer size={spacing.xl} />
          <SectionTitle title="Deneme hatırlatmaları" />
          <Spacer size={spacing.xs} />
          {trials.slice(0, TRIAL_PREVIEW).map((subscription) => (
            <View key={subscription.id} style={styles.item}>
              <SubscriptionTile
                subscription={subscription}
                today={today}
                onPress={() => router.push(`/subscriptions/${subscription.id}` as Href)}
              />
            </View>
          ))}
        </>
      ) : null}

      <Spacer size={spacing.xl} />
      <SectionTitle title="Sıradaki ödeme" />
      <Spacer size={spacing.xs} />
      {upcoming ? (
        <NextPaymentCard subscription={upcoming} today={today} onPress={() => router.push(`/subscriptions/${upcoming.id}` as Href)} />
      ) : (
        <View style={styles.card}>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Önümüzdeki 30 günde yenileme yok.</Text>
        </View>
      )}

      <Spacer size={spacing.xl} />
      <View style={styles.actions}>
        <PrimaryButton label="Abonelik ekle" onPress={() => router.push('/subscriptions/add' as Href)} />
        <OutlinedButton label="Takvimi aç" onPress={() => router.navigate('/calendar' as Href)} />
      </View>

      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function TotalsList({ totals }: { totals: Map<string, Money> }) {
  if (totals.size === 0) {
    return <Text style={textStyle('titleSmall', { color: colors.onSurfaceVariant })}>—</Text>;
  }
  return (
    <View style={styles.totals}>
      {[...totals.entries()].map(([currency, money]) => (
        <Text key={currency} style={textStyle('title')}>
          {formatCurrency(money, currency)}
        </Text>
      ))}
    </View>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={textStyle('titleSmall', { color: colors.primary })}>{value}</Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={textStyle('title')}>{title}</Text>;
}

function NextPaymentCard({ subscription, today, onPress }: { subscription: Subscription; today: CivilDate; onPress: () => void }) {
  const days = daysUntilRenewal(subscription, today);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={textStyle('titleSmall')}>{subscription.name}</Text>
      <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
        {subscription.nextRenewalDate ? formatLongDate(subscription.nextRenewalDate) : '—'}
        {days !== null ? ` · ${renewalLabel(days)}` : ''}
      </Text>
      <Text style={textStyle('titleSmall', { color: colors.primary })}>
        {formatCurrency(subscription.amount, subscription.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenGutter,
  },
  bell: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
    minWidth: spacing.md,
    height: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: screenGutter,
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
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.small,
    backgroundColor: colors.surfaceHigh,
    gap: spacing.xxs,
  },
  item: {
    marginBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  actions: {
    gap: spacing.xs,
  },
});
