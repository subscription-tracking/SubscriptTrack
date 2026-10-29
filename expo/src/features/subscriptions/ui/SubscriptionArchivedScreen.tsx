import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { borderWidth, colors, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../savings/data/queries';
import { changeSubscriptionStatus } from '../data/subscriptionMutations';
import { deleteSubscription } from '../data/subscriptionWriteRepository';
import { cancelSubscriptionReminders } from '../../notifications/data/notificationScheduler';
import { subscriptionKeys, useSubscriptionsQuery } from '../data/queries';
import { archivedSubscriptions } from '../domain/subscriptionList';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, type Subscription } from '../domain/subscription';

/**
 * Arşiv (Flutter `ArchivedSubscriptionsScreen`): her kayıt kartta; tutar ve kategori sağda, "aktif yap"
 * düğmesi ile geri alınır. Arşiv silme değildir; kayıt burada kalır (bkz. ADR 0006).
 */
export function SubscriptionArchivedScreen() {
  useThemeRevision();
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
      try { await cancelSubscriptionReminders([subscription.id]); }
      catch { snackbar.show('Kayıt silindi ancak hatırlatmaları kaldırılamadı. Bildirim izinlerini kontrol et.', 'error'); }
      if (user) {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
        await queryClient.invalidateQueries({ queryKey: savingsKeys.all(user.id) });
      }
      snackbar.show(`${subscription.name} kalıcı olarak silindi.`, 'default');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function confirmRemove(subscription: Subscription) {
    Alert.alert('Yanlış oluşturulan kaydı sil', `${subscription.name} yalnızca yanlış oluşturulmuş bir kayıt ise silinebilir. Abonelik ve ödeme geçmişi geri alınamaz. Bu kayıt yanlış mı oluşturuldu?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet, yanlış kayıt', style: 'destructive', onPress: () => remove.mutate(subscription) },
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
              ListFooterComponent={ScreenBottomInset}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
              renderItem={({ item }) => (
                <ArchivedRow
                  subscription={item}
                  onOpen={() => router.push(`/subscriptions/${item.id}`)}
                  onRestore={() => restore.mutate(item)}
                  onDelete={() => confirmRemove(item)}
                  restorePending={restore.isPending}
                  deletePending={remove.isPending}
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
  restorePending,
  deletePending,
}: {
  subscription: Subscription;
  onOpen: () => void;
  onRestore: () => void;
  onDelete: () => void;
  restorePending: boolean;
  deletePending: boolean;
}) {
  useThemeRevision();
  // Kart düğme değildir: içerik alanı açma düğmesi, geri al ve sil düğmeleri kardeş olarak yer alır (iç içe düğme yok).
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${subscription.name}, ${BILLING_CYCLE_LABELS[subscription.billingCycle]}, ${formatCurrency(subscription.amount, subscription.currency)}, ${CATEGORY_LABELS[subscription.category]}`}
        onPress={onOpen}
        style={styles.content}
      >
      <View style={styles.avatar}>
        <MaterialIcons name="archive" size={sizes.iconButtonSize - spacing.xxs} color={colors.onSurfaceVariant} />
      </View>
      <View style={styles.middle}>
        <Text style={textStyle('bodyStrong')}>{subscription.name}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{BILLING_CYCLE_LABELS[subscription.billingCycle]}</Text>
      </View>
      <View style={styles.trailing}>
        <Text style={textStyle('label', { textAlign: 'right' })}>{formatCurrency(subscription.amount, subscription.currency)}</Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant, textAlign: 'right' })}>{CATEGORY_LABELS[subscription.category]}</Text>
      </View>
      </Pressable>
      <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${subscription.name} aboneliğini aktif yap`} accessibilityState={{ disabled: restorePending }} disabled={restorePending} onPress={onRestore} style={[styles.restore, restorePending && styles.disabled]}>
        <MaterialIcons name="unarchive" size={sizes.iconButtonSize} color={colors.primary} />
        <Text style={textStyle('caption', { color: colors.primary })}>Geri al</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${subscription.name} aboneliğini yanlış kayıt olarak sil`} accessibilityState={{ disabled: deletePending }} disabled={deletePending} onPress={onDelete} style={[styles.restore, styles.remove, deletePending && styles.disabled]}>
        <MaterialIcons name="delete-forever" size={sizes.iconButtonSize} color={colors.error} />
        <Text style={textStyle('caption', { color: colors.error })}>Yanlış kaydı sil</Text>
      </Pressable>
      </View>
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
  list: {
    padding: spacing.md,
  },
  separator: {
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    paddingVertical: spacing.md,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap' },
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
    minWidth: sizes.minTouchTarget + spacing.xs,
    minHeight: sizes.minTouchTarget + spacing.sm,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.medium,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  remove: {
    marginLeft: spacing.sm,
    backgroundColor: withAlpha(colors.error, 0.1),
  },
  disabled: {
    opacity: 0.55,
  },
}));
