import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { TextLink } from '../../../shared/widgets/TextLink';
import { useSubscriptionsQuery } from '../data/queries';
import { countsByTab, type ListTab, visibleSubscriptions } from '../domain/subscriptionList';
import {
  DEFAULT_FILTER,
  activeFilterCount,
  applyFilter,
  availableCurrencies,
  type SubscriptionFilter,
} from '../domain/subscriptionFilter';
import { SubscriptionFilterSheet } from './SubscriptionFilterSheet';
import { type Subscription } from '../domain/subscription';
import { ListTabBar } from './ListTabBar';
import { SubscriptionTile } from './SubscriptionTile';

const EMPTY_BY_TAB: Record<ListTab, { title: string; description?: string }> = {
  active: { title: 'Aktif abonelik yok' },
  trial: { title: 'Deneme aboneliği yok', description: 'Ücretsiz denemelerini burada takip edebilirsin.' },
  paused: { title: 'Duraklatılmış abonelik yok' },
  cancelled: { title: 'İptal edilmiş abonelik yok' },
  expired: {
    title: 'Geçmiş abonelik yok',
    description: 'Duraklatılan, iptal edilen ve süresi dolan kayıtlar burada görünür.',
  },
};

/**
 * Abonelikler sekmesi (Flutter `SubscriptionListScreen`): arama, durum sekmeleri,
 * yenileme tarihine göre sıralı kartlar ve her durum için boş ekran.
 */
export function SubscriptionListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const [tab, setTab] = useState<ListTab>('active');
  const [filter, setFilter] = useState<SubscriptionFilter>(DEFAULT_FILTER);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const all: Subscription[] = query.data ?? [];
  const counts = useMemo(() => countsByTab(all), [all]);
  const items = useMemo(
    () => applyFilter(visibleSubscriptions(all, tab, search), filter, today),
    [all, tab, search, filter, today],
  );
  const currencies = useMemo(() => availableCurrencies(all), [all]);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Abonelikler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : all.length === 0
        ? {
            status: 'empty',
            title: 'Henüz abonelik yok',
            description: 'İlk aboneliğini ekleyerek harcamalarını takip etmeye başla.',
          }
        : { status: 'ready', data: items };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={textStyle('headline')}>Abonelikler</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abonelik ekle"
          onPress={() => router.push('/subscriptions/add' as Href)}
          style={styles.addButton}
        >
          <MaterialIcons name="add" size={24} color={colors.onPrimary} />
        </Pressable>
      </View>
      <Spacer size={spacing.md} />
      <View style={styles.searchWrap}>
        <TextField label="Aboneliklerinde ara" prefixIcon="search" value={search} onChangeText={setSearch} />
      </View>
      <Spacer size={spacing.md} />
      <ListTabBar active={tab} counts={counts} onChange={setTab} />
      <View style={styles.linkRow}>
        <TextLink
          label={activeFilterCount(filter) > 0 ? `Filtrele (${activeFilterCount(filter)})` : 'Filtrele'}
          onPress={() => setSheetOpen(true)}
        />
        <TextLink label="Arşivlenmiş abonelikler" align="end" onPress={() => router.push('/subscriptions/archived' as Href)} />
      </View>
      <SubscriptionFilterSheet
        visible={sheetOpen}
        filter={filter}
        currencies={currencies}
        onChange={setFilter}
        onClose={() => setSheetOpen(false)}
      />
      <Spacer size={spacing.xs} />

      <AsyncStateView state={state}>
        {(data) => (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <Spacer size={spacing.sm} />}
            renderItem={({ item }) => (
              <SubscriptionTile
                subscription={item}
                today={today}
                onPress={() => router.push(`/subscriptions/${item.id}` as Href)}
              />
            )}
            ListEmptyComponent={
              search.trim() ? (
                <EmptyBlock title="Sonuç bulunamadı." />
              ) : (
                <EmptyBlock {...EMPTY_BY_TAB[tab]} />
              )
            }
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function EmptyBlock({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.empty}>
      <MaterialIcons name="subscriptions" size={48} color={colors.onSurfaceVariant} />
      <Spacer size={spacing.md} />
      <Text style={textStyle('titleSmall', { textAlign: 'center' })}>{title}</Text>
      {description ? (
        <>
          <Spacer size={spacing.xs} />
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'center' })}>{description}</Text>
        </>
      ) : null}
    </View>
  );
}

/** Cihazın saat dilimi. Profil saat dilimi Aşama 6'da kullanıcı ayarından okunacak. */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenGutter,
  },
  addButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    borderRadius: sizes.minTouchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  searchWrap: {
    paddingHorizontal: screenGutter,
  },
  list: {
    paddingHorizontal: screenGutter,
    paddingBottom: sizes.bottomNavHeight + spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
