import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, SectionList, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { formatCurrency } from '../../../core/format/money';
import { colors, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { SegmentedControl } from '../../../shared/widgets/SegmentedControl';
import { TextLink } from '../../../shared/widgets/TextLink';
import { markNotificationsRead } from '../data/notificationRepository';
import { useNotificationsQuery } from '../data/queries';
import { useNotificationLocalState } from '../data/notificationLocalState';
import { useNotifyPrefs } from '../data/notificationPrefs';
import { usePermissionQuery } from '../data/notificationPermission';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { useConfirmedRenew } from '../../subscriptions/ui/useConfirmedRenew';
import { collapseDuplicates, groupByDay, rowActionsFor } from './notificationGroups';
import { NotificationCenterHeader } from './NotificationCenterHeader';
import { NotificationRow } from './NotificationRow';
import { PermissionBanner } from './PermissionBanner';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';

type Filter = 'all' | 'unread';

/**
 * Bildirim merkezi: son 14 günün bildirimleri. Aynı abonelik ve türdeki tekrarlar tek satırda "×N" olarak toplanır,
 * satırlar güne göre gruplanır (Bugün, Dün, Bu hafta, Daha eski). Dokunma okundu işaretler ve abonelik ayrıntısını
 * açar; sola kaydırma satırı kapatır; vadesi gelmiş aboneliklerde satırdan "Ödendi" onaylanabilir.
 * Okundu ve kapatma eylemleri grubun tüm kayıtlarına uygulanır.
 */
export function NotificationCenterScreen() {
  useThemeRevision();
  const router = useRouter();
  const { user } = useAuth();
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const query = useNotificationsQuery(user?.id);
  const online = useOnlineStatus();
  const local = useNotificationLocalState(user?.id);
  const subscriptions = useSubscriptionsQuery(user?.id);
  const prefs = useNotifyPrefs();
  const permission = usePermissionQuery();
  const { confirm, pendingId } = useConfirmedRenew(today);
  const [filter, setFilter] = useState<Filter>('all');
  const subscriptionById = useMemo(() => new Map((subscriptions.data ?? []).map((item) => [item.id, item] as const)), [subscriptions.data]);

  const groups = useMemo(() => {
    const serverRead = new Set((query.data ?? []).filter((item) => item.readAt !== null).map((item) => item.id));
    const visible = (query.data ?? []).filter((item) => !local.dismissed.has(item.id));
    return collapseDuplicates(visible).map((group) => ({
      ...group,
      createdAt: group.item.createdAt,
      unreadIds: group.ids.filter((id) => !serverRead.has(id) && !local.read.has(id)),
    }));
  }, [query.data, local.dismissed, local.read]);
  const unreadGroups = groups.filter((group) => group.unreadIds.length > 0);
  const unreadIds = unreadGroups.flatMap((group) => group.unreadIds);
  const shown = filter === 'unread' ? unreadGroups : groups;

  // Yerelde okunmuş ama sunucuda hâlâ okunmamış kayıtları ekran tekrar açıldığında eşitle.
  useEffect(() => {
    if (!local.ready || !query.data) return;
    const pending = query.data.filter((item) => item.readAt === null && local.read.has(item.id)).map((item) => item.id);
    if (pending.length > 0) void markNotificationsRead(pending);
  }, [local.ready, local.read, query.data]);

  // Ayarlardan dönülünce izin durumu yenilenir; izin verilince uyarı bandı kaybolur.
  const refetchPermission = permission.refetch;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refetchPermission();
    });
    return () => subscription.remove();
  }, [refetchPermission]);

  const permissionDenied = prefs.data?.enabled === true && permission.data === 'denied';

  const state: AsyncState<typeof groups> = query.isPending || !local.ready
    ? { status: 'loading' }
    : query.isError && query.data === undefined
      ? {
          status: 'error',
          message: 'Bildirimler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: shown };

  function renderEmpty() {
    if (groups.length === 0) {
      return (
        <View style={styles.empty}>
          <MaterialIcons name="notifications-none" size={sizes.emptyIconLarge + spacing.xxs} color={colors.primary} />
          <Text style={textStyle('body', { marginTop: spacing.md })}>Yeni bildirim yok</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, marginTop: spacing.xs })}>
            Yaklaşan yenilemeler burada görünür.
          </Text>
          <TextLink label="Bildirim ayarları" align="center" onPress={() => router.push('/settings/notifications')} />
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text style={textStyle('body')}>Okunmamış bildirim yok.</Text>
        <TextLink label="Tümünü göster" align="center" onPress={() => setFilter('all')} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NotificationCenterHeader canMarkAll={unreadIds.length > 0} onMarkAll={() => local.markRead(unreadIds)} />
      <View style={styles.filter}>
        <SegmentedControl<Filter>
          accessibilityLabel="Bildirim filtresi"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Tümü' },
            { value: 'unread', label: `Okunmamış (${unreadGroups.length})` },
          ]}
        />
      </View>
      {permissionDenied ? <PermissionBanner message="Bildirim izni kapalı; yeni hatırlatma gelmez." /> : null}
      {query.data !== undefined && (!online || query.isError) ? <View style={styles.filter}><Text accessibilityLiveRegion="polite" style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Bildirimler güncel olmayabilir.</Text><TextLink label="Tekrar dene" onPress={() => void query.refetch()} /></View> : null}
      <AsyncStateView state={state}>
        {(visible) =>
          visible.length === 0 ? (
            renderEmpty()
          ) : (
            <SectionList
              sections={groupByDay(visible, new Date(), timeZone)}
              keyExtractor={(group) => group.item.id}
              contentContainerStyle={styles.list}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => (
                <Text accessibilityRole="header" style={[textStyle('captionStrong', { color: colors.onSurfaceVariant }), styles.sectionHeader]}>
                  {section.title}
                </Text>
              )}
              renderItem={({ item: group }) => {
                const item = group.item;
                const subscription = item.subscriptionId ? subscriptionById.get(item.subscriptionId) : undefined;
                const markGroupRead = () => {
                  if (group.unreadIds.length > 0) local.markRead(group.unreadIds);
                };
                return (
                  <NotificationRow
                    item={item}
                    read={group.unreadIds.length === 0}
                    count={group.count}
                    identity={subscription ? { name: subscription.name, category: subscription.category } : undefined}
                    amountText={subscription ? formatCurrency(subscription.amount, subscription.currency) : undefined}
                    actions={rowActionsFor(item.kind, subscription, today)}
                    paying={subscription !== undefined && pendingId === subscription.id}
                    onOpen={() => {
                      markGroupRead();
                      if (item.subscriptionId) router.push(`/subscriptions/${item.subscriptionId}`);
                    }}
                    onDismiss={() => local.dismiss(group.ids)}
                    onMarkRead={markGroupRead}
                    onPay={subscription ? () => confirm(subscription) : undefined}
                  />
                );
              }}
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
  filter: {
    paddingHorizontal: screenGutter,
    paddingBottom: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
