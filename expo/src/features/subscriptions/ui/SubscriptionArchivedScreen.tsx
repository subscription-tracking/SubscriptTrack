import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { borderWidth, colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../savings/data/queries';
import { changeSubscriptionStatus } from '../data/subscriptionMutations';
import { deleteSubscription } from '../data/subscriptionWriteRepository';
import { subscriptionKeys, useSubscriptionsQuery } from '../data/queries';
import { archivedSubscriptions } from '../domain/subscriptionList';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription } from '../domain/subscription';

/**
 * Arşiv (Flutter `ArchivedSubscriptionsScreen`): her kayıt kartta; tutar ve kategori sağda, "aktif yap"
 * düğmesi ile geri alınır. Arşiv silme değildir; kayıt burada kalır (bkz. ADR 0006).
 */
export function SubscriptionArchivedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const query = useSubscriptionsQuery(user?.id);

  /**
   * Kalıcı silme: yalnızca arşivlenmiş kayıtlardan yapılır (ADR 0006: önce arşiv, silme istisna).
   * Satır ve bağlı ödeme kayıtları geri alınamaz şekilde gider; çevrimdışıyken yapılmaz.
   */
  const remove = useMutation({
    mutationFn: (subscription: Subscription) => {
      if (!online) throw new Error('Silmek için internet bağlantısı gerekir.');
      return deleteSubscription(subscription.id);
    },
    onSuccess: async (_result, subscription) => {
      if (user) {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
        await queryClient.invalidateQueries({ queryKey: savingsKeys.all(user.id) });
      }
      snackbar.show(`${subscription.name} kalıcı olarak silindi.`, 'default');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function confirmRemove(subscription: Subscription) {
    Alert.alert('Aboneliği kalıcı olarak sil', `${subscription.name} ve ödeme geçmişi geri alınamaz şekilde silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Kalıcı olarak sil', style: 'destructive', onPress: () => remove.mutate(subscription) },
    ]);
  }

  const restore = useMutation({
    mutationFn: (subscription: Subscription) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({ userId: user.id, subscriptionId: subscription.id, to: 'active', idempotencyKey: randomUUID() });
    },
    onSuccess: async (_result, subscription) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      snackbar.show(`${subscription.name} aktif aboneliklerine eklendi.`, 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const items = archivedSubscriptions(query.data ?? []);
  const state: AsyncState<Subscription[]> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Arşiv yüklenemedi. Bağlantını kontrol edip tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : { status: 'ready', data: items };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Arşiv" />
      <AsyncStateView state={state}>
        {(data) =>
          data.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="archive" size={sizes.archiveIcon} color={colors.primary} />
              <Text style={textStyle('body', { marginTop: spacing.md })}>Arşivlenmiş abonelik yok</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
              renderItem={({ item }) => (
                <ArchivedRow
                  subscription={item}
                  onOpen={() => router.push(`/subscriptions/${item.id}`)}
                  onRestore={() => restore.mutate(item)}
                  onDelete={() => confirmRemove(item)}
                />
              )}
            />
          )
        }
      </AsyncStateView>
    </View>
  );
}

function ArchivedRow({
  subscription,
  onOpen,
  onRestore,
  onDelete,
}: {
  subscription: Subscription;
  onOpen: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.card}>
      <View style={styles.avatar}>
        <MaterialIcons name="archive" size={sizes.iconButtonSize - spacing.xxs} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.middle}>
        <Text style={textStyle('titleSmall')}>{subscription.name}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{BILLING_CYCLE_LABELS[subscription.billingCycle]}</Text>
      </View>
      <View style={styles.trailing}>
        <Text style={textStyle('bodyMediumStrong', { textAlign: 'right' })}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'right' })}>{CATEGORY_LABELS[subscription.category]}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Aktif yap" onPress={onRestore} style={styles.restore}>
        <MaterialIcons name="unarchive" size={sizes.iconButtonSize} color={colors.primary} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Kalıcı olarak sil" onPress={onDelete} style={styles.restore}>
        <MaterialIcons name="delete-forever" size={sizes.iconButtonSize} color={colors.error} />
      </Pressable>
    </Pressable>
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
    padding: spacing.md,
    paddingBottom: sizes.bottomNavHeight + spacing.xxl,
  },
  separator: {
    height: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: sizes.archiveAvatar,
    height: sizes.archiveAvatar,
    borderRadius: sizes.archiveAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHighest,
  },
  middle: {
    flex: 1,
    marginLeft: spacing.md,
  },
  trailing: {
    alignItems: 'flex-end',
    marginRight: spacing.xs,
  },
  restore: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
