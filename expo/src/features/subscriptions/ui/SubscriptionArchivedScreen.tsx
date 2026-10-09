import { useMemo } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { zoneToday, type CivilDate } from '../../../core/time/calendar';
import { colors, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionsQuery } from '../data/queries';
import { archivedSubscriptions } from '../domain/subscriptionList';
import { type Subscription } from '../domain/subscription';
import { SubscriptionTile } from './SubscriptionTile';

/**
 * Arşivlenmiş abonelikler. Arşiv silme değildir: kayıtlar burada kalır ve detaydaki
 * "Arşivden çıkar" ile geri alınabilir ([ADR 0006](../../../../../docs/decisions/0006-archive-over-delete.md)).
 */
export function SubscriptionArchivedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'), []);

  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Arşiv yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : archivedSubscriptions(query.data ?? []).length === 0
        ? {
            status: 'empty',
            title: 'Arşivlenmiş abonelik yok',
            description: 'Arşivlediğin abonelikler silinmez; burada görünür ve geri alınabilir.',
          }
        : { status: 'ready', data: archivedSubscriptions(query.data ?? []) };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Arşiv</Text>
      </View>
      <Spacer size={spacing.md} />

      <AsyncStateView state={state}>
        {(items) => (
          <FlatList
            data={items}
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
          />
        )}
      </AsyncStateView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenGutter - 8,
    height: sizes.minTouchTarget,
  },
  backButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: screenGutter,
    paddingBottom: sizes.bottomNavHeight + spacing.xxl,
  },
});
