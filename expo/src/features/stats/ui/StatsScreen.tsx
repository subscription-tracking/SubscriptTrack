import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { monthShort } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { SubscriptionTile } from '../../subscriptions/ui/SubscriptionTile';
import { CATEGORY_LABELS, type Subscription } from '../../subscriptions/domain/subscription';
import { usePaymentsQuery } from '../data/queries';
import { monthOverMonthPercent, type PaymentEvent } from '../domain/paymentEvents';
import { buildStatsSummary, type StatsSummary } from '../domain/statsSummary';

/** İstatistik sekmesi (Flutter `StatsScreen` karşılığı): para birimi bazlı toplamlar, trend, kategoriler. */
export function StatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const payments = usePaymentsQuery(user?.id);

  const failed = subscriptions.isError || payments.isError;
  const state: AsyncState<{ subscriptions: Subscription[]; payments: PaymentEvent[] }> =
    subscriptions.isPending || payments.isPending
      ? { status: 'loading' }
      : failed
        ? {
            status: 'error',
            message: 'İstatistikler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
            onRetry: () => {
              void subscriptions.refetch();
              void payments.refetch();
            },
          }
        : { status: 'ready', data: { subscriptions: subscriptions.data ?? [], payments: payments.data ?? [] } };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={textStyle('headline')}>İstatistikler</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(data) => (
          <StatsBody
            subscriptions={data.subscriptions}
            payments={data.payments}
            onOpenPayments={() => router.push('/stats/payments' as Href)}
            onOpenSavings={() => router.push('/savings' as Href)}
            onOpenSubscription={(id) => router.push(`/subscriptions/${id}` as Href)}
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function StatsBody({
  subscriptions,
  payments,
  onOpenPayments,
  onOpenSavings,
  onOpenSubscription,
}: {
  subscriptions: Subscription[];
  payments: PaymentEvent[];
  onOpenPayments: () => void;
  onOpenSavings: () => void;
  onOpenSubscription: (id: string) => void;
}) {
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const now = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<string | null>(null);

  const summary = buildStatsSummary({ subscriptions, payments, today, now, selectedCurrency: selected });
  if (!summary) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={textStyle('title')}>Henüz aktif abonelik yok</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Abonelik eklediğinde toplamlar ve trend burada görünür.
        </Text>
        <OutlinedButton label="Ödeme geçmişi" onPress={onOpenPayments} />
      </View>
    );
  }

  return (
    <Summary
      summary={summary}
      payments={payments}
      today={today}
      now={now}
      onSelectCurrency={setSelected}
      onOpenPayments={onOpenPayments}
      onOpenSavings={onOpenSavings}
      onOpenSubscription={onOpenSubscription}
    />
  );
}

function Summary({
  summary,
  payments,
  today,
  now,
  onSelectCurrency,
  onOpenPayments,
  onOpenSavings,
  onOpenSubscription,
}: {
  summary: StatsSummary;
  payments: PaymentEvent[];
  today: CivilDate;
  now: Date;
  onSelectCurrency: (currency: string) => void;
  onOpenPayments: () => void;
  onOpenSavings: () => void;
  onOpenSubscription: (id: string) => void;
}) {
  const currencyOptions: ChoiceOption<string>[] = summary.currencies.map((value) => ({ value, label: value }));
  const change = monthOverMonthPercent(payments, summary.currency, now);
  const total = summary.monthly.amount;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ChoiceChips options={currencyOptions} value={summary.currency} onChange={onSelectCurrency} />
      <Spacer size={spacing.xs} />

      <View style={styles.card}>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>Aylık tahmini harcama</Text>
        <Text style={textStyle('title')}>{formatCurrency(summary.monthly, summary.currency)}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Yıllık {formatCurrency(summary.yearly, summary.currency)} · {summary.activeCount} aktif abonelik
        </Text>
        {change !== null ? (
          <Text style={textStyle('caption', { color: change > 0 ? statusColors.warning : colors.primary })}>
            {`Geçen aya göre ${change > 0 ? '+' : ''}${change}% (ödeme kayıtlarına göre)`}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Son 6 ay ödemeler</Text>
        {summary.hasPaymentHistory ? (
          <Trend values={summary.trend} now={now} />
        ) : (
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
            Bu para biriminde ödeme kaydı yok. Ödeme ekledikçe trend burada görünür.
          </Text>
        )}
        <OutlinedButton label="Ödeme geçmişi" onPress={onOpenPayments} />
      </View>

      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Kategoriler</Text>
        {summary.categories.map((share) => {
          const ratio = total > 0 ? Math.min(1, share.monthly.amount / total) : 0;
          return (
            <View key={share.category} style={styles.categoryRow}>
              <View style={styles.categoryText}>
                <Text style={textStyle('bodySmall')}>{CATEGORY_LABELS[share.category]}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
                </View>
              </View>
              <Text style={textStyle('caption')}>{formatCurrency(share.monthly, summary.currency)}</Text>
            </View>
          );
        })}
      </View>

      {summary.dueSoon.length > 0 ? (
        <View style={styles.section}>
          <Text style={textStyle('titleSmall')}>Önümüzdeki 7 gün</Text>
          {summary.dueSoon.map((subscription) => (
            <SubscriptionTile
              key={subscription.id}
              subscription={subscription}
              today={today}
              onPress={() => onOpenSubscription(subscription.id)}
            />
          ))}
        </View>
      ) : null}

      {summary.highest ? (
        <View style={styles.card}>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>En yüksek aylık maliyet</Text>
          <Pressable accessibilityRole="button" onPress={() => onOpenSubscription(summary.highest?.id ?? '')}>
            <Text style={textStyle('titleSmall')}>{summary.highest.name}</Text>
          </Pressable>
        </View>
      ) : null}

      <OutlinedButton label="Tasarruf analizi" onPress={onOpenSavings} />
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function Trend({ values, now }: { values: number[]; now: Date }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.trend}>
      {values.map((value, index) => {
        const monthIndex = now.getMonth() - (values.length - 1 - index);
        const label = monthShort(((monthIndex % 12) + 12) % 12 + 1);
        return (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${Math.round((value / max) * 100)}%` }]} />
            </View>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
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
    gap: spacing.md,
    paddingBottom: sizes.bottomNavHeight,
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
  trend: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    gap: spacing.xxs,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryText: {
    flex: 1,
    gap: spacing.xxs,
  },
  track: {
    height: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});
