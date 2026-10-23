import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState, EmptyStateLayout } from '../../../shared/widgets/EmptyState';
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

  const state: AsyncState<{ subscriptions: Subscription[]; payments: PaymentEvent[] }> =
    subscriptions.isPending || payments.isPending
      ? { status: 'loading' }
      : subscriptions.isError || payments.isError
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
            <EmptyStateLayout>
              <EmptyState
                icon="bar-chart"
                title="Henüz analiz yok"
                description="Aylık abonelik giderlerini görmek için ilk aboneliğini ekle."
                actionLabel="İlk aboneliğini ekle"
                onAction={() => router.push('/subscriptions/add')}
              />
            </EmptyStateLayout>
          );
        }
        const now = new Date();
        const summary = buildStatsSummary({
          subscriptions: data.subscriptions,
          payments: data.payments,
          today,
          now,
          timeZone,
          activeCurrency: currency,
          months,
        });
        if (!summary) {
          return (
            <EmptyStateLayout>
              <EmptyState
                icon="bar-chart"
                title="Bu para biriminde analiz yok"
                description={`${currency} para biriminde aktif abonelik yok. Para birimini Ayarlar > Görünüm ve bölge bölümünden değiştirebilirsin.`}
                actionLabel="Abonelik ekle"
                onAction={() => router.push('/subscriptions/add')}
              />
            </EmptyStateLayout>
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
            <Body
              summary={summary}
              now={now}
              timeZone={timeZone}
              months={months}
              onMonthsChanged={setMonths}
              onPayments={() => router.push('/stats/payments')}
              onSavings={() => router.push('/savings')}
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
}: {
  summary: StatsSummary;
  now: Date;
  timeZone: string;
  months: number;
  onMonthsChanged: (months: number) => void;
  onPayments: () => void;
  onSavings: () => void;
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
            onReviewDue={onSavings}
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
  gap16: {
    height: spacing.md,
  },
  gap20: {
    height: gaps.sectionTop - 8,
  },
}));
