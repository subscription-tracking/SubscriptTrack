import { useMemo } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate, civilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { activeForTotals } from '../../dashboard/domain/dashboardSummary';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { useSavingsQuery } from '../data/queries';
import { savingsTotalsByCurrency, potentialSavings, type SavingsEvent } from '../domain/savingsSummary';

const OPPORTUNITY_PREVIEW = 5;

/** Tasarruf analizi: toplam yıllık tasarruf, olası fırsatlar ve iptal/duraklatma geçmişi. */
export function SavingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const savings = useSavingsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const state: AsyncState<{ subscriptions: Subscription[]; savings: SavingsEvent[] }> =
    subscriptions.isPending || savings.isPending
      ? { status: 'loading' }
      : subscriptions.isError || savings.isError
        ? {
            status: 'error',
            message: 'Tasarruf verisi yüklenemedi. Bağlantını kontrol edip tekrar dene.',
            onRetry: () => {
              void subscriptions.refetch();
              void savings.refetch();
            },
          }
        : {
            status: 'ready',
            data: { subscriptions: subscriptions.data ?? [], savings: savings.data ?? [] },
          };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Tasarruf analizi</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(data) => (
          <SavingsBody
            subscriptions={data.subscriptions}
            events={data.savings}
            today={today}
            onOpenSubscription={(id) => router.push(`/subscriptions/${id}` as Href)}
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function SavingsBody({
  subscriptions,
  events,
  today,
  onOpenSubscription,
}: {
  subscriptions: Subscription[];
  events: SavingsEvent[];
  today: CivilDate;
  onOpenSubscription: (id: string) => void;
}) {
  const names = useMemo(() => new Map(subscriptions.map((item) => [item.id, item.name])), [subscriptions]);
  const totals = useMemo(() => savingsTotalsByCurrency(events), [events]);
  const opportunities = useMemo(() => potentialSavings(activeForTotals(subscriptions, today)), [subscriptions, today]);

  if (events.length === 0 && opportunities.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={textStyle('title')}>Henüz tasarruf görünmüyor</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Duraklattığın ya da iptal ettiğin abonelikler burada tasarruf olarak görünür.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Kaydedilen yıllık tasarruf</Text>
        {totals.size === 0 ? (
          <Text style={textStyle('titleSmall', { color: colors.onSurfaceVariant })}>Henüz yok</Text>
        ) : (
          [...totals.entries()].map(([currency, money]) => (
            <Text key={currency} style={textStyle('title')}>
              {formatCurrency(money, currency)}
            </Text>
          ))
        )}
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Duraklatma ve iptal anındaki aylık tutar × 12 olarak hesaplanır.
        </Text>
      </View>

      {opportunities.length > 0 ? (
        <View style={styles.section}>
          <Text style={textStyle('titleSmall')}>Tasarruf fırsatları</Text>
          {opportunities.slice(0, OPPORTUNITY_PREVIEW).map(({ subscription, annual }) => (
            <Pressable
              key={subscription.id}
              accessibilityRole="button"
              onPress={() => onOpenSubscription(subscription.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.rowText}>
                <Text style={textStyle('titleSmall')}>{subscription.name}</Text>
                <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Olası yıllık maliyet</Text>
              </View>
              <Text style={textStyle('titleSmall', { color: colors.primary })}>{formatCurrency(annual, subscription.currency)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {events.length > 0 ? (
        <View style={styles.section}>
          <Text style={textStyle('titleSmall')}>Duraklatma ve iptal geçmişi</Text>
          {events.map((event, index) => (
            <View key={`${event.effectiveAt}-${index}`} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={textStyle('titleSmall')}>
                  {event.subscriptionId ? (names.get(event.subscriptionId) ?? 'Silinmiş abonelik') : 'Abonelik'}
                </Text>
                <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
                  {event.eventType === 'PAUSED' ? 'Duraklatıldı' : 'İptal edildi'} · {formatLongDate(localCivil(event.effectiveAt))}
                </Text>
              </View>
              <Text style={textStyle('titleSmall', { color: colors.primary })}>{formatCurrency(event.annual, event.currency)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function localCivil(iso: string): CivilDate {
  const date = new Date(iso);
  return civilDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: screenGutter,
    gap: spacing.md,
  },
  emptyWrap: {
    paddingHorizontal: screenGutter,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
