import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate, formatRelativeDate } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, sizes, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { inCurrency } from '../../subscriptions/domain/currencyFilter';
import { useActiveCurrency } from '../../settings/data/useActiveCurrency';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { analyticsKeys, usePaymentsQuery } from '../data/queries';
import { deletePayment, recordPayment, updatePayment } from '../data/paymentRepository';
import { localCivilDate, paidAtFromCivil, type PaymentEvent } from '../domain/paymentEvents';
import { groupPaymentsByMonth } from '../domain/paymentGroups';
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

  const currency = useActiveCurrency();
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
        : {
            status: 'ready',
            data: {
              payments: (payments.data ?? []).filter((payment) => payment.currency === currency),
              subscriptions: inCurrency(subscriptions.data ?? [], currency),
            },
          };

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
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const names = useMemo(() => new Map(subscriptions.map((item) => [item.id, item.name])), [subscriptions]);
  const listItems = useMemo(() => groupPaymentsByMonth(payments), [payments]);
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
          data={listItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text style={textStyle('caption12Strong', { color: colors.onSurfaceVariant, marginTop: spacing.sm })}>{item.label}</Text>
            ) : (
              <PaymentCard
                payment={item.payment}
                name={names.get(item.payment.subscriptionId ?? '') ?? 'Silinmiş abonelik'}
                dateLabel={`${formatLongDate(localCivilDate(item.payment.paidAt))} · ${formatRelativeDate(localCivilDate(item.payment.paidAt), today)}`}
                onEdit={() => setEditing(item.payment)}
                onDelete={() => remove.mutate(item.payment.id)}
              />
            )
          }
        />
      )}

      <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={[styles.fab, { bottom: insets.bottom + spacing.md }]}>
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
    paddingBottom: spacing.huge + spacing.xl,
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
    minHeight: sizes.minTouchTarget + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
