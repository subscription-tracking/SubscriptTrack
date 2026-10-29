import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCivilToday } from '../../../core/clock/useCivilToday';
import { type CivilDate } from '../../../core/time/calendar';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { colors, gaps, sizes, spacing } from '../../../shared/design/tokens';
import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState, EmptyStateLayout } from '../../../shared/widgets/EmptyState';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { textStyle } from '../../../shared/design/typography';
import { formatLongDate } from '../../../core/format/date';
import { weekdayName } from '../domain/dayLabel';
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
          paymentsUnavailable={payments.data === undefined}
          paymentsLoading={payments.data === undefined && (payments.isPending || payments.isRefetching)}
          onRetryPayments={() => void payments.refetch()}
          today={today}
          timeZone={timeZone}
          bottomInset={sizes.bottomNavHeight + insets.bottom + spacing.xl}
          refreshing={query.isRefetching || payments.isRefetching}
          onRefresh={() => { void Promise.all([query.refetch(), payments.refetch()]); }}
        />
      )}
    </AsyncStateView>
  );
}

function Summary({
  subscriptions,
  payments,
  paymentsUnavailable,
  paymentsLoading,
  onRetryPayments,
  today,
  timeZone,
  bottomInset,
  refreshing,
  onRefresh,
}: {
  subscriptions: Subscription[];
  payments: PaymentEvent[];
  paymentsUnavailable: boolean;
  paymentsLoading: boolean;
  onRetryPayments: () => void;
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
  const later = upcomingByDay(subscriptions, today, Number.MAX_SAFE_INTEGER).filter((day) => day.dayOffset > 14);

  const toSubscriptions = () => router.navigate('/subscriptions');
  const toStats = () => router.navigate('/stats');
  const toAdd = () => router.push('/subscriptions/add');
  const openSubscription = (id: string) => router.push(`/subscriptions/${id}`);
  const showEmptyState = active.length === 0 && summaries.length === 0 && !paymentsUnavailable;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        showEmptyState && styles.emptyContent,
        { paddingBottom: bottomInset },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={textStyle('headline')}><Text>Subscript</Text><Text style={{ color: colors.primary }}>Track</Text></Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{`${formatLongDate(today).replace(` ${today.year}`, '')} ${weekdayName(today)}`}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Bildirimleri aç" onPress={() => router.push('/notifications')} style={styles.headerAction}>
          <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
      {showEmptyState ? (
        <EmptyStateLayout>
          <EmptyState
            icon="subscriptions"
            title="Aboneliklerin tek yerde"
            description="İlk aboneliğini ekle; ücretleri, yenileme tarihlerini ve denemeleri kolayca takip et."
            actionLabel="İlk aboneliğini ekle"
            onAction={toAdd}
          />
        </EmptyStateLayout>
      ) : (
        <>
          <HeroCard summaries={summaries} fallbackCurrency={currency} unavailable={paymentsUnavailable} loading={paymentsLoading} onPress={toStats} onRetry={onRetryPayments} />
          {attention.length > 0 ? (
            <>
              <Spacer size={gaps.sectionTop} />
              <AttentionSection items={attention} today={today} onOpen={openSubscription} onMore={toSubscriptions} />
            </>
          ) : null}
          <Spacer size={gaps.sectionTop} />
          <UpcomingTimeline
            days={upcoming}
            later={later}
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
          <Spacer size={gaps.sectionTop} />
          <TonalButton label="Abonelik ekle" onPress={toAdd} />
          <Pressable accessibilityRole="button" accessibilityLabel="Takvimi aç" onPress={() => router.push('/calendar')} style={styles.calendarAction}>
            <MaterialIcons name="calendar-today" size={22} color={colors.onSurfaceVariant} /><Text style={textStyle('bodyStrong')}>Takvimi aç</Text>
          </Pressable>
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
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headingText: { flex: 1 },
  headerAction: { minWidth: sizes.minTouchTarget, minHeight: sizes.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  calendarAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: sizes.minTouchTarget, marginTop: spacing.sm },
  content: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
    paddingTop: spacing.none,
    paddingHorizontal: spacing.none,
  },
}));
