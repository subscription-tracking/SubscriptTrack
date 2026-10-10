import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { inCurrency } from '../../subscriptions/domain/currencyFilter';
import { useActiveCurrency } from '../../settings/data/useActiveCurrency';
import { useSavingsQuery } from '../../savings/data/queries';
import { usePaymentsQuery } from '../../stats/data/queries';
import { savingsTotalsByCurrency } from '../../savings/domain/savingsSummary';
import { type PaymentEvent } from '../../stats/domain/paymentEvents';
import { type SavingsEvent } from '../../savings/domain/savingsSummary';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { activeForTotals, monthlyTotalsByCurrency, nextPayment, renewingWithin, trialsByEnd } from '../domain/dashboardSummary';
import { annualChipLabel, categoryTotals, completedThisMonth, monthChangeLabel } from '../domain/dashboardHero';
import { CategoryDonutCard, QuickActions } from './OverviewCards';
import { HeroCard } from './HeroCard';
import { NextPaymentCard, EmptyIntro, EmptyRenewalsCard, SavingsSummaryCard } from './NextPaymentCards';
import { SectionHeader, StatChips } from './StatChips';

const TRIAL_PREVIEW = 3;

/**
 * Ana sayfa (Flutter `DashboardScreen`). Sıra: kahraman kart, üç çip, deneme hatırlatmaları, sıradaki
 * ödeme, kategori donut'ı, hızlı işlemler, tasarruf özeti ve ilk abonelik istemi.
 */
export function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const query = useSubscriptionsQuery(user?.id);
  const payments = usePaymentsQuery(user?.id);
  const savings = useSavingsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Özet yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: query.data ?? [] };

  return (
    <AsyncStateView state={state}>
      {(subscriptions) => (
        <Summary
          subscriptions={subscriptions}
          payments={payments.data ?? []}
          savings={savings.data ?? []}
          today={today}
          bottomInset={sizes.bottomNavHeight + insets.bottom + spacing.xl}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
        />
      )}
    </AsyncStateView>
  );
}

function Summary({
  subscriptions,
  payments,
  savings,
  today,
  bottomInset,
  refreshing,
  onRefresh,
}: {
  subscriptions: Subscription[];
  payments: PaymentEvent[];
  savings: SavingsEvent[];
  today: CivilDate;
  bottomInset: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const now = new Date();
  // Ana sayfa toplamları yalnızca aktif para birimini gösterir (kur çevrimi yok).
  const currency = useActiveCurrency();
  const inActiveCurrency = inCurrency(subscriptions, currency);
  const active = activeForTotals(inActiveCurrency, today);
  const monthly = monthlyTotalsByCurrency(active);
  const upcomingSoon = renewingWithin(inActiveCurrency, today, 7).length;
  const trials = trialsByEnd(subscriptions);
  const upcoming = nextPayment(subscriptions, today);

  const toSubscriptions = () => router.navigate('/subscriptions');
  const toStats = () => router.navigate('/stats');
  const toAdd = () => router.push('/subscriptions/add');
  const openSubscription = (id: string) => router.push(`/subscriptions/${id}`);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <HeroCard
        totals={monthly}
        monthChange={monthChangeLabel(payments, now)}
        completed={completedThisMonth(active, payments, now)}
        totalActive={active.length}
        onAnalysis={active.length === 0 ? null : toStats}
      />
      <Spacer size={gaps.sectionInner} />
      <StatChips
        items={[
          { icon: 'refresh', label: `${active.length} aktif abonelik` },
          { icon: 'notifications-active', label: `Bu hafta ${upcomingSoon} yenileme` },
          { icon: 'bar-chart', label: annualChipLabel(monthly) },
        ]}
      />
      <Spacer size={gaps.sectionTop} />

      {trials.length > 0 ? (
        <>
          <SectionHeader
            title="Yaklaşan yenilemeler"
            action={trials.length > TRIAL_PREVIEW ? 'Tümünü gör' : undefined}
            onAction={toSubscriptions}
          />
          <Spacer size={gaps.sectionInner} />
          {trials.slice(0, TRIAL_PREVIEW).map((subscription) => (
            <View key={subscription.id} style={styles.trialItem}>
              <NextPaymentCard subscription={subscription} today={today} onPress={() => openSubscription(subscription.id)} />
            </View>
          ))}
          <Spacer size={gaps.sectionTop} />
        </>
      ) : null}

      <SectionHeader title="Sıradaki ödeme" action={upcoming ? 'Takvimde gör' : undefined} onAction={toSubscriptions} />
      <Spacer size={gaps.sectionInner} />
      {upcoming ? (
        <NextPaymentCard subscription={upcoming} today={today} onPress={() => openSubscription(upcoming.id)} />
      ) : (
        <EmptyRenewalsCard />
      )}

      {active.length > 0 ? (
        <>
          <Spacer size={gaps.sectionTop} />
          <CategoryDonutCard totals={categoryTotals(active)} onAll={toStats} />
          <Spacer size={gaps.sectionTop} />
          <QuickActions
            actions={[
              { icon: 'add-circle-outline', label: 'Abonelik ekle', color: colors.primary, onPress: toAdd },
              { icon: 'calendar-today', label: 'Takvimi aç', color: colors.secondary, onPress: toSubscriptions },
              { icon: 'pie-chart-outline', label: 'Dağılım', color: colors.tertiary, onPress: toStats },
            ]}
          />
        </>
      ) : null}

      {savings.length > 0 ? (
        <>
          <Spacer size={gaps.sectionTop} />
          <SavingsSummaryCard totals={savingsTotalsByCurrency(savings)} />
        </>
      ) : null}

      {active.length === 0 ? (
        <>
          <Spacer size={spacing.xl} />
          <EmptyIntro />
          <Spacer size={gaps.sectionInner} />
          <PrimaryButton label="İlk aboneliğini ekle" icon="add" onPress={toAdd} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  trialItem: {
    marginBottom: gaps.trialCard,
  },
});
