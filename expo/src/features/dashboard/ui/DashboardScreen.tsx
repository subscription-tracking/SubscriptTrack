import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCivilToday } from '../../../core/clock/useCivilToday';
import { type CivilDate } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useAuth } from '../../auth/AuthProvider';
import { useActiveCurrency, useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { usePaymentsQuery } from '../../stats/data/queries';
import { type PaymentEvent } from '../../stats/domain/paymentEvents';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { categoryTotals } from '../domain/dashboardHero';
import { activeForTotals } from '../domain/dashboardSummary';
import { attentionItems, monthPaymentSummary, upcomingByDay } from '../domain/homeSummary';
import { AttentionSection } from './AttentionSection';
import { CategoryBarCard } from './CategoryBarCard';
import { HeroCard } from './HeroCard';
import { EmptyIntro } from './NextPaymentCards';
import { UpcomingTimeline } from './UpcomingTimeline';

/**
 * Ana sayfa. Sıra: bu ay kalan ödemeler (kahraman), dikkat gerektirenler, önümüzdeki 14 gün ve bu ayın
 * dağılımı. Hiç aktif abonelik yokken başlangıç açıklaması ve ilk abonelik istemi gösterilir.
 */
export function DashboardScreen() {
  useThemeRevision();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const query = useSubscriptionsQuery(user?.id);
  const payments = usePaymentsQuery(user?.id);
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);

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
          today={today}
          timeZone={timeZone}
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
  today,
  timeZone,
  bottomInset,
  refreshing,
  onRefresh,
}: {
  subscriptions: Subscription[];
  payments: PaymentEvent[];
  today: CivilDate;
  timeZone: string;
  bottomInset: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  useThemeRevision();
  const router = useRouter();
  const currency = useActiveCurrency();
  const active = activeForTotals(subscriptions, today);
  const summaries = monthPaymentSummary(active, payments, today, new Date(), timeZone, currency);
  const attention = attentionItems(subscriptions, today);
  const upcoming = upcomingByDay(subscriptions, today, 14);

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
      {active.length === 0 && summaries.length === 0 ? (
        <>
          <EmptyIntro />
          <Spacer size={gaps.sectionInner} />
          <PrimaryButton label="İlk aboneliğini ekle" icon="add" onPress={toAdd} />
        </>
      ) : (
        <>
          <HeroCard summaries={summaries} fallbackCurrency={currency} onPress={toStats} />
          {attention.length > 0 ? (
            <>
              <Spacer size={gaps.sectionTop} />
              <AttentionSection items={attention} today={today} onOpen={openSubscription} onMore={toSubscriptions} />
            </>
          ) : null}
          <Spacer size={gaps.sectionTop} />
          <UpcomingTimeline
            days={upcoming}
            onOpen={openSubscription}
            onCalendar={() => router.push('/calendar')}
            onAll={toSubscriptions}
            onReminders={() => router.push('/settings/notifications')}
          />
          {active.length > 0 ? (
            <>
              <Spacer size={gaps.sectionTop} />
              <CategoryBarCard totals={categoryTotals(active)} onPress={toStats} />
            </>
          ) : null}
        </>
      )}
    </ScrollView>
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
}));
