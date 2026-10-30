import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, type ListRenderItemInfo, Pressable, RefreshControl, ScrollView, type ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate } from '../../../core/time/calendar';
import { colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState, EmptyStateLayout } from '../../../shared/widgets/EmptyState';
import { useSubscriptionsQuery } from '../data/queries';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useDeletionAction } from './useDeletionAction';
import { countsByTab, LIST_TABS, type ListTab, splitAttention, visibleSubscriptions } from '../domain/subscriptionList';
import { DEFAULT_FILTER, activeFilterCount, applyFilter, type SubscriptionFilter } from '../domain/subscriptionFilter';
import { type Subscription, type SubscriptionCategory } from '../domain/subscription';
import { hiddenCount } from '../domain/currencyFilter';
import { activeMonthlyTotals, rowPosition } from '../domain/monthlyTotal';
import { formatCurrency } from '../../../core/format/money';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ListTabBar } from './ListTabBar';
import { SubscriptionFilterSheet } from './SubscriptionFilterSheet';
import { SubscriptionListHeader } from './SubscriptionListHeader';
import { tapFeedback } from '../../../shared/haptics';
import { MonthlyTotalRow, SelectionActionBar, SelectionTopBar } from './SelectionBars';
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

/** Liste satırı: abonelik ya da küçük bölüm başlığı ("Geciken ödemeler"). */
type ListRow = { kind: 'header'; key: string; title: string } | { kind: 'item'; key: string; subscription: Subscription };

/** Gecikmiş ve bugün vadeli kayıtlar üstte ayrı bir bölümde; başka kayıt yoksa başlık gösterilmez. */
function withAttentionGroup(items: Subscription[], today: CivilDate): ListRow[] {
  const { attention, rest } = splitAttention(items, today);
  const asRows = (list: Subscription[]): ListRow[] => list.map((subscription) => ({ kind: 'item', key: subscription.id, subscription }));
  if (attention.length === 0) return asRows(items);
  const rows: ListRow[] = [{ kind: 'header', key: 'h-attention', title: 'Dikkat gerektiren ödemeler' }, ...asRows(attention)];
  if (rest.length > 0) rows.push({ kind: 'header', key: 'h-rest', title: 'Diğer abonelikler' }, ...asRows(rest));
  return rows;
}

/** Satır anahtarı; bileşen referansı render dışında sabit tutulur (FlatList yeniden oluşturmasın). */
function keyOf(row: ListRow): string {
  return row.key;
}

/** Kaydırma penceresi: ilk ekrana sığan satırlar kadar çizilir. */
const INITIAL_ROWS = 10;
const WINDOW_SIZE = 7;

/**
 * Abonelikler sekmesi (Flutter `SubscriptionListScreen`): arama ve filtre başlığı, üç hap sekme ve
 * yatay kaydırılabilir sayfalar (Aktif, Deneme, Geçmiş). Sekme değişimi kaydırmayla da yapılır.
 */
export function SubscriptionListScreen() {
  useThemeRevision();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const online = useOnlineStatus();
  const [tab, setTab] = useState<ListTab>('active');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<SubscriptionFilter>(DEFAULT_FILTER);
  const pager = useRef<ScrollViewInstance>(null);

  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const [selected, setSelected] = useState<string[] | null>(null);
  const deletion = useDeletionAction(() => setSelected(null));
  const everything: Subscription[] = useMemo(() => query.data ?? [], [query.data]);
  // Tüm para birimleri listelenir; filtre yalnız kullanıcının seçimiyle uygulanır.
  const all: Subscription[] = everything;
  const counts = useMemo(() => countsByTab(all), [all]);
  // Arşiv ekranı tüm para birimlerini gösterir; bağlantı etkin para birimine göre gizlenmemeli.
  const hasArchived = everything.some((subscription) => subscription.status === 'archived');

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError && query.data === undefined
      ? {
          status: 'error',
          message: 'Abonelikler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: all };

  // Pencere genişliği değişince (döndürme) sayfa ofseti yeni genişliğe göre yeniden hizalanır.
  useEffect(() => {
    const index = LIST_TABS.findIndex((item) => item.key === tab);
    pager.current?.scrollTo({ x: index * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  // Sekme türetmeleri yalnızca veri, arama, süzgeç veya gün değişince yeniden hesaplanır.
  const pages = useMemo(
    () =>
      LIST_TABS.map((item) => ({
        key: item.key,
        total: counts[item.key],
        items: (() => {
          const filtered = applyFilter(visibleSubscriptions(all, item.key, search), filter, today);
          return filter.sort === 'date' ? withAttentionGroup(filtered, today) : filtered.map((subscription) => ({ kind: 'item' as const, key: subscription.id, subscription }));
        })(),
      })),
    [all, counts, search, filter, today],
  );
  const monthly = activeMonthlyTotals(all);
  const hiddenByCurrency = filter.currency === null ? 0 : hiddenCount(all, filter.currency);
  const showGlobalEmpty = state.status === 'ready' && all.length === 0;
  const currentPage = pages.find((page) => page.key === tab);
  const visibleIds = new Set(currentPage?.items.filter((item) => item.kind === 'item').map((item) => item.key) ?? []);
  const visibleSelected = selected?.filter((id) => visibleIds.has(id)) ?? [];
  const filterCount = activeFilterCount(filter);

  const openSubscription = useCallback((id: string) => router.push(`/subscriptions/${id}`), [router]);
  const startSelection = useCallback((id: string) => setSelected([id]), []);
  const toggleSelected = useCallback(
    (id: string) => { tapFeedback(); setSelected((current) => (current?.includes(id) ? current.filter((item) => item !== id) : [...(current ?? []), id])); },
    [],
  );
  const renderRow = useCallback(
    ({ item: entry, index }: ListRenderItemInfo<ListRow>, rows: ListRow[]) => {
      if (entry.kind === 'header') return <Text style={textStyle('label', { color: colors.onSurfaceVariant, marginTop: index === 0 ? 0 : spacing.md, marginBottom: spacing.xs })}>{entry.title}</Text>;
      const row = entry.subscription;
      const position = rowPosition(rows, index);
      return (
        <SubscriptionTile subscription={row} position={position} today={today} onLongPress={selected === null ? startSelection : undefined} selected={selected === null ? undefined : selected.includes(row.id)} onPress={selected === null ? openSubscription : toggleSelected} />
      );
    },
    [selected, today, openSubscription, toggleSelected, startSelection],
  );

  function selectTab(next: ListTab) {
    if (next !== tab) setSelected(null);
    setTab(next);
    const index = LIST_TABS.findIndex((item) => item.key === next);
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  function onMomentumEnd(offsetX: number) {
    const index = Math.round(offsetX / width);
    const next = LIST_TABS[index]?.key;
    if (next && next !== tab) { setSelected(null); setTab(next); }
  }

  const bottomInset = sizes.bottomNavHeight + insets.bottom + spacing.xl;

  return (
    <View style={styles.screen}>
      {state.status === 'ready' && (!online || query.isError) ? <Text accessibilityLiveRegion="polite" style={styles.cacheNotice}>Bağlantı veya yenileme sorunu: gösterilen veriler güncel olmayabilir.</Text> : null}
      {showGlobalEmpty ? (
        <EmptyStateLayout
          footer={(
            <Pressable accessibilityRole="button" onPress={() => setSheetOpen(true)} style={styles.importAction}>
              <Text style={textStyle('label', { color: colors.primary })}>CSV dosyasından içe aktar</Text>
            </Pressable>
          )}
        >
          <EmptyState
            icon="grid-view"
            title="Henüz abonelik yok"
            description="İlk aboneliğini ekle; ücretlerini ve yenileme tarihlerini buradan takip et."
            actionLabel="İlk aboneliğini ekle"
            onAction={() => router.push('/subscriptions/add')}
          />
        </EmptyStateLayout>
      ) : (
        <>
          {selected === null ? (
            <>
              <SubscriptionListHeader
                search={search}
                onSearchChange={(value) => { setSelected(null); setSearch(value); }}
                onFilter={() => setSheetOpen(true)}
                onSelect={(currentPage?.total ?? 0) > 0 ? () => setSelected([]) : undefined}
                activeFilterCount={filterCount}
              />
              <ListTabBar active={tab} counts={counts} onChange={selectTab} />
              {monthly.length > 0 ? <MonthlyTotalRow amount={monthly.map((item) => formatCurrency(item.total, item.currency)).join(' · ')} hiddenNote={hiddenByCurrency > 0 ? `${hiddenByCurrency} kayıt başka para biriminde gizli` : undefined} /> : null}
            </>
          ) : (
            <SelectionTopBar
              count={visibleSelected.length}
              allSelected={visibleSelected.length === visibleIds.size}
              onClose={() => setSelected(null)}
              onToggleAll={() => setSelected(visibleSelected.length === visibleIds.size ? [] : [...visibleIds])}
            />
          )}
          <View style={styles.pagerWrap}>
            <AsyncStateView state={state}>
              {(data) => (
                <ScrollView
                  ref={pager}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  scrollEventThrottle={16}
                  onMomentumScrollEnd={(event) => onMomentumEnd(event.nativeEvent.contentOffset.x)}
                >
                  {pages.map((page) => (
                    <View key={page.key} style={{ width }}>
                      {page.total === 0 ? (
                        <View style={styles.emptyWrap}>
                          <EmptyState
                            icon="grid-view"
                            title={EMPTY_BY_TAB[page.key].message}
                            description={EMPTY_BY_TAB[page.key].detail}
                            actionLabel="Abonelik ekle"
                            onAction={() => router.push('/subscriptions/add')}
                          />
                        </View>
                      ) : page.items.length === 0 ? (
                        <View style={styles.noResult}>
                          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Sonuç bulunamadı.</Text>
                        </View>
                      ) : (
                        <FlatList
                          data={page.items}
                          keyExtractor={keyOf}
                          keyboardShouldPersistTaps="handled"
                          initialNumToRender={INITIAL_ROWS}
                          windowSize={WINDOW_SIZE}
                          extraData={selected}
                          contentContainerStyle={[styles.list, { paddingBottom: bottomInset }]}
                          refreshControl={
                            <RefreshControl
                              refreshing={query.isRefetching}
                              onRefresh={() => void query.refetch()}
                              tintColor={colors.primary}
                            />
                          }
                          renderItem={(info) => renderRow(info, page.items)}
                        />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </AsyncStateView>
          </View>
          {selected !== null ? (
            <SelectionActionBar count={visibleSelected.length} busy={deletion.busy} bottom={bottomInset - spacing.xs} onDelete={() => deletion.confirm(visibleSelected)} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Abonelik ekle" onPress={() => router.push('/subscriptions/add')} style={[styles.fab, { bottom: bottomInset }]}>
              <MaterialIcons name="add" size={32} color={colors.onPrimary} />
            </Pressable>
          )}
        </>
      )}
      <SubscriptionFilterSheet
        visible={sheetOpen}
        category={filter.category}
        sort={filter.sort}
        currency={filter.currency}
        onCurrency={(currency) => { setSelected(null); setFilter((previous) => ({ ...previous, currency })); }}
        hasArchived={hasArchived}
        onCategory={(next: SubscriptionCategory | null) => { setSelected(null); setFilter((prev) => ({ ...prev, category: next })); }}
        onSort={(next) => { setSelected(null); setFilter((prev) => ({ ...prev, sort: next })); }}
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

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pagerWrap: {
    flex: 1,
  },
  importAction: {
    minHeight: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    padding: spacing.xxl,
  },
  noResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingTop: spacing.md, paddingHorizontal: spacing.lg },
  fab: { position: 'absolute', right: spacing.lg, width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  cacheNotice: { ...textStyle('bodySmall', { color: colors.onSurfaceVariant }), paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
}));
