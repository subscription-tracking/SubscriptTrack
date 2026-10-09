import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { formatCurrency } from '../../../core/format/money';
import { formatRelativeDate } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { analyticsKeys, usePaymentsQuery } from '../data/queries';
import { deletePayment, recordPayment, updatePayment } from '../data/paymentRepository';
import { localCivilDate, paidAtFromCivil, type PaymentEvent } from '../domain/paymentEvents';
import { AddPaymentDialog, EditPaymentDialog } from './PaymentDialogs';

const OFFLINE_MESSAGE = 'Ödeme kaydı için internet bağlantısı gerekir.';

/**
 * Ödeme geçmişi (Flutter `PaymentHistoryScreen`): kayıtlar kart listesi olarak; her kartta ad, tarih, tutar ve
 * düzenle/sil düğmeleri. "Kayıt ekle" uzatılmış düğmesi ekleme iletişim kutusunu açar. Silme onay istemez.
 */
export function PaymentHistoryScreen() {
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const subscriptions = useSubscriptionsQuery(user?.id);
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const state: AsyncState<{ payments: PaymentEvent[]; subscriptions: Subscription[] }> =
    payments.isPending || subscriptions.isPending
      ? { status: 'loading' }
      : payments.isError || subscriptions.isError
        ? {
            status: 'error',
            message: 'Ödeme geçmişi yüklenemedi. Bağlantını kontrol edip tekrar dene.',
            onRetry: () => {
              void payments.refetch();
              void subscriptions.refetch();
            },
          }
        : { status: 'ready', data: { payments: payments.data ?? [], subscriptions: subscriptions.data ?? [] } };

  return (
    <View style={styles.screen}>
      <ScreenTopBar title="Ödeme geçmişi" />
      <AsyncStateView state={state}>
        {(data) => <History payments={data.payments} subscriptions={data.subscriptions} today={today} />}
      </AsyncStateView>
    </View>
  );
}

function History({ payments, subscriptions, today }: { payments: PaymentEvent[]; subscriptions: Subscription[]; today: CivilDate }) {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const names = useMemo(() => new Map(subscriptions.map((item) => [item.id, item.name])), [subscriptions]);
  const addable = subscriptions.filter((item) => item.status !== 'archived');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PaymentEvent | null>(null);

  const refresh = async () => {
    if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
  };

  const add = useMutation({
    mutationFn: async (input: { subscription: Subscription; amount: string }) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await recordPayment({
        idempotencyKey: randomUUID(),
        subscriptionId: input.subscription.id,
        amount: input.amount,
        currency: input.subscription.currency,
        paidAt: paidAtFromCivil(today),
      });
    },
    onSuccess: async () => {
      await refresh();
      setAdding(false);
      snackbar.show('Ödeme kaydedildi.', 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const edit = useMutation({
    mutationFn: async (input: { id: string; amount: string; paidAt: Date }) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await updatePayment(input);
    },
    onSuccess: async () => {
      await refresh();
      setEditing(null);
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      await deletePayment(id);
    },
    onSuccess: refresh,
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  return (
    <View style={styles.body}>
      {payments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Henüz manuel ödeme kaydı yok.</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <PaymentCard
              payment={item}
              name={names.get(item.subscriptionId ?? '') ?? 'Silinmiş abonelik'}
              dateLabel={formatRelativeDate(localCivilDate(item.paidAt), today)}
              onEdit={() => setEditing(item)}
              onDelete={() => remove.mutate(item.id)}
            />
          )}
        />
      )}

      <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.fab}>
        <MaterialIcons name="add" size={sizes.iconButtonSize} color={colors.onPrimary} />
        <Text style={textStyle('label', { color: colors.onPrimary, marginLeft: spacing.xs })}>Kayıt ekle</Text>
      </Pressable>

      <AddPaymentDialog
        visible={adding}
        subscriptions={addable}
        onClose={() => setAdding(false)}
        onSave={({ subscription, amount }) => add.mutate({ subscription, amount: amount.decimalString })}
      />
      {editing ? (
        <EditPaymentDialog
          visible
          currency={editing.currency}
          initialAmount={editing.amount.amount.toFixed(2)}
          onClose={() => setEditing(null)}
          onSave={(amount) => edit.mutate({ id: editing.id, amount: amount.decimalString, paidAt: new Date(editing.paidAt) })}
        />
      ) : null}
    </View>
  );
}

function PaymentCard({
  payment,
  name,
  dateLabel,
  onEdit,
  onDelete,
}: {
  payment: PaymentEvent;
  name: string;
  dateLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.texts}>
        <Text style={textStyle('body')} numberOfLines={1}>
          {name}
        </Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{dateLabel}</Text>
      </View>
      <Text style={textStyle('bodyMediumStrong')}>{formatCurrency(payment.amount, payment.currency)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Düzenle" onPress={onEdit} style={styles.iconButton}>
        <MaterialIcons name="edit" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Sil" onPress={onDelete} style={styles.iconButton}>
        <MaterialIcons name="delete-outline" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: sizes.bottomNavHeight + spacing.xxl,
  },
  separator: {
    height: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: gaps.cardInset,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.medium,
    borderWidth: borderWidth.hairline,
    borderColor: withAlpha(colors.outline, 0.5),
    backgroundColor: colors.surface,
  },
  texts: {
    flex: 1,
    marginRight: spacing.xs,
  },
  iconButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: sizes.bottomNavHeight + spacing.md,
    minHeight: sizes.minTouchTarget + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
