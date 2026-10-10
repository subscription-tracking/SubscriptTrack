import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { formatRelativeDate } from '../../../core/format/date';
import { type CivilDate, civilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { activeForTotals } from '../../subscriptions/domain/activeSelectors';
import { inCurrency } from '../../subscriptions/domain/currencyFilter';
import { useActiveCurrency } from '../../settings/data/useActiveCurrency';
import { monthlyEquivalent, type Subscription } from '../../subscriptions/domain/subscription';
import { useSavingsQuery } from '../data/queries';
import { type SavingsEvent } from '../domain/savingsSummary';
import { SavingsRow } from './SavingsRow';

/**
 * Tasarruf analizi (Flutter `SavingsScreen`): her para birimi için en yüksek tutarlı üç aboneliğin iptal
 * senaryosu kartı, tüm aktif aboneliklerin olası yıllık tasarrufu ve duraklatma/iptal geçmişi.
 */
export function SavingsScreen() {
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
      <ScreenTopBar title="Tasarruf analizi" />
      <AsyncStateView state={state}>
        {(data) => <SavingsBody subscriptions={data.subscriptions} events={data.savings} today={today} />}
      </AsyncStateView>
    </View>
  );
}

/** Bir para biriminde en yüksek aylık tutarlı en çok üç abonelik (Flutter `_Top3Card` girdisi). */
function topThree(active: readonly Subscription[]): Map<string, Subscription[]> {
  const byCurrency = new Map<string, Subscription[]>();
  for (const subscription of active) {
    byCurrency.set(subscription.currency, [...(byCurrency.get(subscription.currency) ?? []), subscription]);
  }
  for (const [currency, items] of byCurrency) {
    byCurrency.set(
      currency,
      [...items].sort((a, b) => monthlyEquivalent(b).minorUnits - monthlyEquivalent(a).minorUnits).slice(0, 3),
    );
  }
  return byCurrency;
}

/** Başlık: kayıt sayısına ve birden çok para birimi olup olmamasına göre (Flutter `_headline`). */
function headline(count: number, currency: string, showCurrency: boolean): string {
  if (count === 1) {
    return showCurrency ? `${currency} aboneliğini iptal edersen` : 'Aboneliğini iptal edersen';
  }
  const unit = showCurrency ? `${currency} ` : '';
  return `En yüksek tutarlı ${count} ${unit}aboneliğini iptal edersen`;
}

function SavingsBody({ subscriptions, events, today }: { subscriptions: Subscription[]; events: SavingsEvent[]; today: CivilDate }) {
  // Tasarruf yalnızca aktif para birimini gösterir; diğer para birimlerinin olayları gizlenir.
  const currency = useActiveCurrency();
  const active = activeForTotals(inCurrency(subscriptions, currency), today);
  const visibleEvents = events.filter((event) => event.currency === currency);
  const groups = useMemo(() => topThree(active), [active]);
  const showCurrency = groups.size > 1;
  // Üst kartın saydığı üç kayıt "Tasarruf fırsatları"nda; geri kalanı "Diğer fırsatlar"da.
  const featuredIds = useMemo(() => new Set([...groups.values()].flat().map((item) => item.id)), [groups]);
  const featured = active.filter((item) => featuredIds.has(item.id));
  const others = active.filter((item) => !featuredIds.has(item.id));

  if (active.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={textStyle('body', { color: colors.onSurfaceVariant, textAlign: 'center' })}>Henüz abonelik yok.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {[...groups.entries()].map(([currency, items]) => {
        const monthly = items.reduce((sum: Money, item) => sum.add(monthlyEquivalent(item)), Money.zero);
        const yearly = monthly.multiply(12);
        return (
          <View key={currency} style={styles.topCard}>
            <Text style={textStyle('titleSmall', { color: colors.onPrimaryContainer })}>{headline(items.length, currency, showCurrency)}</Text>
            <Text style={textStyle('headlineSmall', { color: colors.onPrimaryContainer, marginTop: spacing.sm })}>
              {`${formatCurrency(yearly, currency)}/yıl tasarruf`}
            </Text>
            <Text style={textStyle('bodySmall', { color: colors.onPrimaryContainer })}>{`${formatCurrency(monthly, currency)}/ay`}</Text>
          </View>
        );
      })}

      <Text style={textStyle('titleSmall', { marginTop: gaps.sectionInner - 2 })}>Tasarruf fırsatları</Text>
      {featured.map((subscription) => (
        <SavingsRow key={subscription.id} subscription={subscription} />
      ))}
      {others.length > 0 ? (
        <>
          <Text style={textStyle('titleSmall', { marginTop: gaps.rowLoose + spacing.xs - 2 })}>Diğer fırsatlar</Text>
          {others.map((subscription) => (
            <SavingsRow key={subscription.id} subscription={subscription} />
          ))}
        </>
      ) : null}

      {visibleEvents.length > 0 ? (
        <>
          <Text style={textStyle('titleSmall', { marginTop: gaps.rowLoose + spacing.xs - 2 })}>İptal ve duraklatma geçmişi</Text>
          {visibleEvents.map((event, index) => (
            <View key={`${event.effectiveAt}-${index}`} style={styles.historyRow}>
              <MaterialIcons name="trending-down" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
              <View style={styles.historyText}>
                <Text style={textStyle('body')}>{event.eventType === 'PAUSED' ? 'Abonelik duraklatıldı' : 'Abonelik iptal edildi'}</Text>
                <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{formatRelativeDate(localCivil(event.effectiveAt), today)}</Text>
              </View>
              <Text style={textStyle('bodySmallStrong')}>{`${formatCurrency(event.annual, event.currency)}/yıl`}</Text>
            </View>
          ))}
        </>
      ) : null}
      <View style={styles.bottom} />
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
  },
  content: {
    padding: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  topCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.outlineHalf,
    backgroundColor: colors.primaryContainer,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: gaps.cardInset,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.outlineHalf,
    backgroundColor: colors.surface,
  },
  historyText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bottom: {
    height: sizes.bottomNavHeight,
  },
});
