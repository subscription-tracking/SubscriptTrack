import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { markNotificationsRead, type CenterNotification } from '../data/notificationRepository';
import { useNotificationsQuery } from '../data/queries';
import { useNotificationLocalState } from '../data/notificationLocalState';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { groupByDay } from './notificationGroups';
import { NotificationRow } from './NotificationRow';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';

/**
 * Bildirim merkezi (Flutter `NotificationCenterScreen`): son 14 günün bildirimleri. Dokunma okundu işaretler ve
 * abonelik ayrıntısını açar; sola kaydırma satırı kapatır; "Tümünü okundu say" hepsini işaretler.
 * Satırlar güne göre gruplanır (Bugün, Dün, Bu hafta, Daha eski).
 */
export function NotificationCenterScreen() {
  useThemeRevision();
  const router = useRouter();
  const { user } = useAuth();
  const timeZone = useUserTimeZone();
  const query = useNotificationsQuery(user?.id);
  const local = useNotificationLocalState(user?.id);
  const subscriptions = useSubscriptionsQuery(user?.id);
  const amounts = useMemo(
    () => new Map((subscriptions.data ?? []).map((item) => [item.id, formatCurrency(item.amount, item.currency)] as const)),
    [subscriptions.data],
  );

  const items = useMemo(() => (query.data ?? []).filter((item) => !local.dismissed.has(item.id)), [query.data, local.dismissed]);
  const isRead = (item: CenterNotification) => item.readAt !== null || local.read.has(item.id);
  const unreadIds = items.filter((item) => !isRead(item)).map((item) => item.id);

  // Yerelde okunmuş ama sunucuda hâlâ okunmamış kayıtları ekran tekrar açıldığında eşitle.
  useEffect(() => {
    if (!local.ready || !query.data) return;
    const pending = query.data.filter((item) => item.readAt === null && local.read.has(item.id)).map((item) => item.id);
    if (pending.length > 0) void markNotificationsRead(pending);
  }, [local.ready, local.read, query.data]);

  function markOne(item: CenterNotification) {
    if (isRead(item)) return;
    local.markRead([item.id]);
  }

  function markAll() {
    if (unreadIds.length === 0) return;
    local.markRead(unreadIds);
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
      <ScreenTopBar title="Bildirimler" />
      {unreadIds.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={markAll} style={styles.markAll}>
          <Text style={textStyle('label', { color: colors.primary })}>Tümünü okundu say</Text>
        </Pressable>
      ) : null}
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
            <SectionList
              sections={groupByDay(visible, new Date(), timeZone)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => (
                <Text accessibilityRole="header" style={[textStyle('captionStrong', { color: colors.onSurfaceVariant }), styles.sectionHeader]}>
                  {section.title}
                </Text>
              )}
              renderItem={({ item }) => (
                <NotificationRow
                  item={item}
                  read={isRead(item)}
                  timeZone={timeZone}
                  amountText={item.subscriptionId ? amounts.get(item.subscriptionId) : undefined}
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

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAll: {
    alignSelf: 'flex-end',
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  list: {
    paddingVertical: spacing.xs,
    paddingBottom: sizes.bottomNavHeight + spacing.xl,
  },
}));
