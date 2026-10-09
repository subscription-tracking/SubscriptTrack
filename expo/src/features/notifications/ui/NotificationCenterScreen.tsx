import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { markNotificationsRead, type CenterNotification } from '../data/notificationRepository';
import { useNotificationsQuery } from '../data/queries';
import { useNotificationLocalState } from '../data/notificationLocalState';
import { NotificationRow } from './NotificationRow';

/**
 * Bildirim merkezi (Flutter `NotificationCenterScreen`): son 14 günün bildirimleri. Dokunma okundu işaretler ve
 * abonelik ayrıntısını açar; sola kaydırma satırı kapatır; "Tümünü okundu say" hepsini işaretler.
 */
export function NotificationCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const query = useNotificationsQuery(user?.id);
  const local = useNotificationLocalState();

  const items = useMemo(() => (query.data ?? []).filter((item) => !local.dismissed.has(item.id)), [query.data, local.dismissed]);
  const isRead = (item: CenterNotification) => item.readAt !== null || local.read.has(item.id);
  const unreadIds = items.filter((item) => !isRead(item)).map((item) => item.id);

  function markOne(item: CenterNotification) {
    if (isRead(item)) return;
    local.markRead([item.id]);
    void markNotificationsRead([item.id]);
  }

  function markAll() {
    if (unreadIds.length === 0) return;
    local.markRead(unreadIds);
    void markNotificationsRead(unreadIds);
  }

  const state: AsyncState<CenterNotification[]> = query.isPending || !local.ready
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Bildirimler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: items };

  return (
    <View style={styles.screen}>
      <ScreenTopBar
        title="Bildirimler"
        action={unreadIds.length > 0 ? { label: 'Tümünü okundu say', onPress: markAll } : undefined}
      />
      <AsyncStateView state={state}>
        {(visible) =>
          visible.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={sizes.emptyIconLarge + spacing.xxs} color={colors.primary} />
              <Text style={textStyle('body', { marginTop: spacing.md })}>Yeni bildirim yok</Text>
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
                Yaklaşan yenilemeler burada görünür.
              </Text>
            </View>
          ) : (
            <FlatList
              data={visible}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <NotificationRow
                  item={item}
                  read={isRead(item)}
                  onOpen={() => {
                    markOne(item);
                    if (item.subscriptionId) router.push(`/subscriptions/${item.subscriptionId}`);
                  }}
                  onDismiss={() => local.dismiss(item.id)}
                />
              )}
            />
          )
        }
      </AsyncStateView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingVertical: spacing.xs,
    paddingBottom: sizes.bottomNavHeight + spacing.xl,
  },
});
