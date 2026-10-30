import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { orderCurrencies } from '../../../core/domain/moneyByCurrency';
import { SegmentedControl } from '../../../shared/widgets/SegmentedControl';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { textStyle } from '../../../shared/design/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState } from '../../../shared/widgets/EmptyState';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { activeForTotals } from '../../subscriptions/domain/activeSelectors';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { usePaymentsQuery } from '../data/queries';
import { type PaymentEvent } from '../domain/paymentEvents';
import { buildStatsSummary, type StatsSummary } from '../domain/statsSummary';
import { ActionCards } from './cards/ActionCards';
import { CategoryBreakdownCard } from './cards/CategoryBreakdownCard';
import { useActiveCurrency, useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { HeroSpendingCard } from './cards/HeroSpendingCard';
import { InsightsCard } from './cards/InsightsCard';
import { TrendCard } from './cards/TrendCard';

/**
 * İstatistikler sekmesi (Flutter `StatsScreen`, gömülü mod): para birimi seçici, hero harcama kartı, 3/6/12 ay
 * trend kartı, öne çıkanlar, kategori dağılımı ve tasarruf / ödeme geçmişi kısayolları. Sekme başlığı kabukta.
 */
export function StatsScreen() {
  useThemeRevision();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const subscriptions = useSubscriptionsQuery(user?.id);
  const payments = usePaymentsQuery(user?.id);
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const [months, setMonths] = useState(6);
  const currency = useActiveCurrency();
  const [pickedCurrency, setPickedCurrency] = useState<string | null>(null);
  const online = useOnlineStatus();

  const state: AsyncState<{ subscriptions: Subscription[]; payments: PaymentEvent[] }> =
    (subscriptions.isPending && subscriptions.data === undefined) || (payments.isPending && payments.data === undefined)
      ? { status: 'loading' }
      : (subscriptions.isError && subscriptions.data === undefined) || (payments.isError && payments.data === undefined)
        ? {
            status: 'error',
            message: 'İstatistikler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
            onRetry: () => {
              void subscriptions.refetch();
              void payments.refetch();
            },
          }
        : { status: 'ready', data: { subscriptions: subscriptions.data ?? [], payments: payments.data ?? [] } };

  const bottomInset = sizes.bottomNavHeight + insets.bottom + spacing.xl;

  return (
    <AsyncStateView state={state}>
      {(data) => {
        if (activeForTotals(data.subscriptions, today).length === 0) {
          return (
            <ScrollView contentContainerStyle={[styles.emptyStage, { paddingBottom: bottomInset }]}>
              <EmptyState
                icon="bar-chart"
                title="Henüz analiz yok"
                description="Aylık abonelik giderlerini görmek için ilk aboneliğini ekle."
                actionLabel="İlk aboneliğini ekle"
                onAction={() => router.push('/subscriptions/add')}
              />
            <View style={styles.emptyActions}>
              <ActionCards onSavings={() => router.push('/savings')} onPaymentHistory={() => router.push('/stats/payments')} />
            </View>
            </ScrollView>
          );
        }
        const now = new Date();
        // Yüzde ve grafikler para birimi karıştıramaz: tek para birimi gösterilir; birden çoksa üstte seçici çıkar.
        const available = orderCurrencies(activeForTotals(data.subscriptions, today).map((item) => item.currency), currency);
        const shownCurrency = pickedCurrency !== null && available.includes(pickedCurrency) ? pickedCurrency : available.includes(currency) ? currency : available[0];
        const summary = buildStatsSummary({
          subscriptions: data.subscriptions,
          payments: data.payments,
          today,
          now,
          timeZone,
          activeCurrency: shownCurrency,
          months,
        });
        if (!summary) {
          return (
            <ScrollView contentContainerStyle={[styles.emptyStage, { paddingBottom: bottomInset }]}>
              <EmptyState
                icon="bar-chart"
                title="Bu para biriminde analiz yok"
                description={`${shownCurrency} para biriminde aktif abonelik yok.`}
                actionLabel="Abonelik ekle"
                onAction={() => router.push('/subscriptions/add')}
              />
            <View style={styles.emptyActions}>
              <ActionCards onSavings={() => router.push('/savings')} onPaymentHistory={() => router.push('/stats/payments')} />
            </View>
            </ScrollView>
          );
        }
        return (
          <ScrollView
            style={styles.screen}
            contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={subscriptions.isRefetching || payments.isRefetching}
                onRefresh={() => {
                  void subscriptions.refetch();
                  void payments.refetch();
                }}
                tintColor={colors.primary}
              />
            }
          >
            {!online || subscriptions.isError || payments.isError ? <Text accessibilityLiveRegion="polite" style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginBottom: spacing.md })}>Bağlantı veya yenileme sorunu: analiz güncel olmayabilir. Yenilemek için ekranı aşağı çek.</Text> : null}
            {available.length > 1 && available.length <= 4 ? (
              <View style={styles.currencyPicker}>
                <SegmentedControl accessibilityLabel="Para birimi" options={available.map((code) => ({ value: code, label: code }))} value={shownCurrency} onChange={setPickedCurrency} />
                <Text style={textStyle('caption', { marginTop: spacing.xs })}>Para birimleri birbirine çevrilmez; her biri ayrı analiz edilir.</Text>
              </View>
            ) : null}
            <Body
              summary={summary}
              now={now}
              timeZone={timeZone}
              months={months}
              onMonthsChanged={setMonths}
              onPayments={() => router.push('/stats/payments')}
              onSavings={() => router.push('/savings')}
              onReviewDue={() => router.navigate('/subscriptions')}
            />
          </ScrollView>
        );
      }}
    </AsyncStateView>
  );
}

function Body({
  summary,
  now,
  timeZone,
  months,
  onMonthsChanged,
  onPayments,
  onSavings,
  onReviewDue,
}: {
  summary: StatsSummary;
  now: Date;
  timeZone: string;
  months: number;
  onMonthsChanged: (months: number) => void;
  onPayments: () => void;
  onSavings: () => void;
  onReviewDue: () => void;
}) {
  useThemeRevision();
  const highest = summary.highest;
  const hasInsights = highest !== null || summary.dueSoon.length > 0;
  return (
    <>

      <HeroSpendingCard
        monthly={summary.monthly}
        yearly={summary.yearly}
        currency={summary.currency}
        activeCount={summary.activeCount}
        trend={summary.trend}
        hasPaymentHistory={summary.hasPaymentHistory}
      />
      <View style={styles.gap20} />

      <TrendCard
        trend={summary.trend}
        currency={summary.currency}
        months={months}
        hasPaymentHistory={summary.hasPaymentHistory}
        monthly={summary.monthly}
        now={now}
        timeZone={timeZone}
        onMonthsChanged={onMonthsChanged}
      />
      <View style={styles.gap20} />

      {hasInsights ? (
        <>
          <InsightsCard
            highest={highest}
            total={summary.monthly}
            currency={summary.currency}
            dueSoon={summary.dueSoon}
            onReviewDue={onReviewDue}
          />
          <View style={styles.gap20} />
        </>
      ) : null}

      <CategoryBreakdownCard entries={summary.categories} total={summary.monthly} currency={summary.currency} />
      <View style={styles.gap20} />

      <ActionCards onSavings={onSavings} onPaymentHistory={onPayments} />
      <View style={styles.gap16} />
    </>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  currencyPicker: { marginBottom: spacing.md },
  emptyStage: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  emptyActions: { paddingTop: spacing.md },
  gap16: {
    height: spacing.md,
  },
  gap20: {
    height: gaps.sectionTop - 8,
  },
}));
