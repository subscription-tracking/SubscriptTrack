import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, type ListRenderItemInfo, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate } from '../../../core/time/calendar';
import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { EmptyState, EmptyStateLayout } from '../../../shared/widgets/EmptyState';
import { useSubscriptionsQuery } from '../data/queries';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useDeletionAction } from './useDeletionAction';
import { countsByTab, LIST_TABS, type ListTab, splitAttention, visibleSubscriptions } from '../domain/subscriptionList';
import { DEFAULT_FILTER, activeFilterCount, applyFilter, type SubscriptionFilter } from '../domain/subscriptionFilter';
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

/** Liste satırı: abonelik ya da küçük bölüm başlığı ("Geciken ödemeler"). */
type ListRow = { kind: 'header'; key: string; title: string } | { kind: 'item'; key: string; subscription: Subscription };

/** Gecikmiş ve bugün vadeli kayıtlar üstte ayrı bir bölümde; başka kayıt yoksa başlık gösterilmez. */
function withAttentionGroup(items: Subscription[], today: CivilDate): ListRow[] {
  const { attention, rest } = splitAttention(items, today);
  const asRows = (list: Subscription[]): ListRow[] => list.map((subscription) => ({ kind: 'item', key: subscription.id, subscription }));
  if (attention.length === 0) return asRows(items);
  const rows: ListRow[] = [{ kind: 'header', key: 'h-attention', title: 'Geciken ödemeler' }, ...asRows(attention)];
  if (rest.length > 0) rows.push({ kind: 'header', key: 'h-rest', title: 'Diğer abonelikler' }, ...asRows(rest));
  return rows;
}

/** Satır anahtarı; bileşen referansı render dışında sabit tutulur (FlatList yeniden oluşturmasın). */
function keyOf(row: ListRow): string {
  return row.key;
}

function ItemSeparator() {
  return <View style={styles.separator} />;
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
  const [tab, setTab] = useState<ListTab>('active');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<SubscriptionFilter>(DEFAULT_FILTER);
  const pager = useRef<ScrollView>(null);

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
    : query.isError
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
        total: visibleSubscriptions(all, item.key, '').length,
        items: withAttentionGroup(applyFilter(visibleSubscriptions(all, item.key, search), filter, today), today),
      })),
    [all, search, filter, today],
  );
  const showGlobalEmpty = state.status === 'ready' && all.length === 0;
  const currentPage = pages.find((page) => page.key === tab);
  const filterCount = activeFilterCount(filter);
  const selectionActions = (currentPage?.total ?? 0) > 0
    ? selected === null
      ? [{ label: 'Seç', icon: 'checklist' as const, onPress: () => setSelected([]), accessibilityLabel: 'Çoklu seçim başlat' }]
      : [
          { label: 'Bitti', icon: 'close' as const, onPress: () => setSelected(null), accessibilityLabel: 'Seçimden çık' },
          { label: `Sil ${selected.length}`, icon: 'delete-outline' as const, onPress: () => deletion.confirm(selected), danger: true, disabled: deletion.busy || selected.length === 0, accessibilityLabel: `${selected.length} seçili aboneliği sil` },
        ]
    : [];

  const openSubscription = useCallback((id: string) => router.push(`/subscriptions/${id}`), [router]);
  const toggleSelected = useCallback(
    (id: string) => setSelected((current) => (current?.includes(id) ? current.filter((item) => item !== id) : [...(current ?? []), id])),
    [],
  );
  const renderRow = useCallback(
    ({ item: entry }: ListRenderItemInfo<ListRow>) => {
      if (entry.kind === 'header') return <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{entry.title}</Text>;
      const row = entry.subscription;
      return (
      <View>
        {selected !== null ? (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(row.id) }} accessibilityLabel={`${row.name} seç`} onPress={() => toggleSelected(row.id)} style={styles.selection}>
            <Text style={textStyle('bodyStrong')}>{selected.includes(row.id) ? '☑ Seçili' : '□ Seç'}</Text>
          </Pressable>
        ) : null}
        <SubscriptionTile subscription={row} today={today} onPress={openSubscription} />
      </View>
      );
    },
    [selected, today, openSubscription, toggleSelected],
  );

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
          <SubscriptionListHeader
            search={search}
            onSearchChange={setSearch}
            onAdd={() => router.push('/subscriptions/add')}
            onFilter={() => setSheetOpen(true)}
            activeFilterCount={filterCount}
          />
          <ListTabBar active={tab} counts={counts} onChange={selectTab} actions={selectionActions} />
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
                          ItemSeparatorComponent={ItemSeparator}
                          refreshControl={
                            <RefreshControl
                              refreshing={query.isRefetching}
                              onRefresh={() => void query.refetch()}
                              tintColor={colors.primary}
                            />
                          }
                          renderItem={renderRow}
                        />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </AsyncStateView>
          </View>
        </>
      )}
      <SubscriptionFilterSheet
        visible={sheetOpen}
        category={filter.category}
        sort={filter.sort}
        currency={filter.currency}
        onCurrency={(currency) => setFilter((previous) => ({ ...previous, currency }))}
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
  list: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: spacing.none,
  },
  selection: { minHeight: sizes.minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
}));
