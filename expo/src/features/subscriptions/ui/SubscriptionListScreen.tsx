import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState } from '../../../shared/widgets/EmptyState';
import { useSubscriptionsQuery } from '../data/queries';
import { useActiveCurrency } from '../../settings/data/useActiveCurrency';
import { hiddenCount, inCurrency } from '../domain/currencyFilter';
import { countsByTab, LIST_TABS, type ListTab, visibleSubscriptions } from '../domain/subscriptionList';
import { DEFAULT_FILTER, applyFilter, type SubscriptionFilter } from '../domain/subscriptionFilter';
import { type Subscription, type SubscriptionCategory } from '../domain/subscription';
import { ListTabBar } from './ListTabBar';
import { SubscriptionFilterSheet } from './SubscriptionFilterSheet';
import { SubscriptionListHeader } from './SubscriptionListHeader';
import { SubscriptionTile } from './SubscriptionTile';

/** Her sekmenin boş ekran metni (Flutter `SubscriptionListScreen._tab`). */
const EMPTY_BY_TAB: Record<ListTab, { message: string; detail: string }> = {
  active: { message: 'Aktif abonelik yok', detail: 'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.' },
  trial: { message: 'Deneme aboneliği yok', detail: 'Ücretsiz denemelerini burada takip edebilirsin.' },
  history: {
    message: 'Geçmiş abonelik yok',
    detail: 'Duraklatılan, iptal edilen ve süresi dolan kayıtlar burada görünür.',
  },
};

/**
 * Abonelikler sekmesi (Flutter `SubscriptionListScreen`): arama ve filtre başlığı, üç hap sekme ve
 * yatay kaydırılabilir sayfalar (Aktif, Deneme, Geçmiş). Sekme değişimi kaydırmayla da yapılır.
 */
export function SubscriptionListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const [tab, setTab] = useState<ListTab>('active');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<SubscriptionFilter>(DEFAULT_FILTER);
  const pager = useRef<ScrollView>(null);

  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const currency = useActiveCurrency();
  const everything: Subscription[] = query.data ?? [];
  // Aktif para birimi dışındaki kayıtlar listelenmez; sayıları aşağıda not olarak belirtilir.
  const all: Subscription[] = inCurrency(everything, currency);
  const hidden = hiddenCount(everything, currency);
  const counts = useMemo(() => countsByTab(all), [all]);
  const hasArchived = all.some((subscription) => subscription.status === 'archived');

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Abonelikler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: all };

  function selectTab(next: ListTab) {
    setTab(next);
    const index = LIST_TABS.findIndex((item) => item.key === next);
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  function onMomentumEnd(offsetX: number) {
    const index = Math.round(offsetX / width);
    const next = LIST_TABS[index]?.key;
    if (next && next !== tab) setTab(next);
  }

  const bottomInset = sizes.bottomNavHeight + insets.bottom + spacing.xl;

  return (
    <View style={styles.screen}>
      <SubscriptionListHeader
        search={search}
        onSearchChange={setSearch}
        onAdd={() => router.push('/subscriptions/add')}
        onFilter={() => setSheetOpen(true)}
      />
      <ListTabBar active={tab} counts={counts} onChange={selectTab} />
      {hidden > 0 ? (
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant, paddingHorizontal: spacing.lg, marginTop: spacing.xs })}>
          {`${hidden} kayıt ${currency} dışındaki para birimlerinde; gizli.`}
        </Text>
      ) : null}
      <View style={styles.pagerWrap}>
        <AsyncStateView state={state}>
          {(data) => (
            <ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event) => onMomentumEnd(event.nativeEvent.contentOffset.x)}
            >
              {LIST_TABS.map((item) => {
                const pageAll = visibleSubscriptions(data, item.key, '');
                const items = applyFilter(visibleSubscriptions(data, item.key, search), filter, today);
                return (
                  <View key={item.key} style={{ width }}>
                    {pageAll.length === 0 ? (
                      <View style={styles.emptyWrap}>
                        <EmptyState
                          icon="grid-view"
                          title={EMPTY_BY_TAB[item.key].message}
                          description={EMPTY_BY_TAB[item.key].detail}
                          actionLabel="Abonelik ekle"
                          onAction={() => router.push('/subscriptions/add')}
                        />
                      </View>
                    ) : items.length === 0 ? (
                      <View style={styles.noResult}>
                        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Sonuç bulunamadı.</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={items}
                        keyExtractor={(row) => row.id}
                        contentContainerStyle={[styles.list, { paddingBottom: bottomInset }]}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        refreshControl={
                          <RefreshControl
                            refreshing={query.isRefetching}
                            onRefresh={() => void query.refetch()}
                            tintColor={colors.primary}
                          />
                        }
                        renderItem={({ item: row }) => (
                          <SubscriptionTile
                            subscription={row}
                            today={today}
                            onPress={() => router.push(`/subscriptions/${row.id}`)}
                          />
                        )}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </AsyncStateView>
      </View>
      <SubscriptionFilterSheet
        visible={sheetOpen}
        category={filter.category}
        sort={filter.sort}
        hasArchived={hasArchived}
        onCategory={(next: SubscriptionCategory | null) => setFilter((prev) => ({ ...prev, category: next }))}
        onSort={(next) => setFilter((prev) => ({ ...prev, sort: next }))}
        onOpenArchive={() => {
          setSheetOpen(false);
          router.push('/subscriptions/archived');
        }}
        onImportCsv={() => {
          setSheetOpen(false);
          router.push('/subscriptions/import');
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pagerWrap: {
    flex: 1,
  },
  emptyWrap: {
    padding: spacing.xxl,
    flex: 1,
    justifyContent: 'center',
  },
  noResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: spacing.xs,
  },
});
