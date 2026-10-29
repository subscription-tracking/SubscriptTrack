import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate, } from '../../../core/time/calendar';
import { borderWidth, colors, radius, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { inCurrency } from '../../subscriptions/domain/currencyFilter';
import { useActiveCurrency, useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { usePaymentsQuery } from '../data/queries';
import { usePaymentHistoryActions } from './usePaymentHistoryActions';
import { localCivilDate, type PaymentEvent } from '../domain/paymentEvents';
import { groupPaymentsByMonth } from '../domain/paymentGroups';
import { paymentStatusLabel } from '../domain/paymentStatusLabel';
import { AddPaymentDialog, EditPaymentDialog } from './PaymentDialogs';


/**
 * Ödeme geçmişi (Flutter `PaymentHistoryScreen`): kayıtlar kart listesi olarak; her kartta ad, tarih, tutar ve
 * düzenle/sil düğmeleri. "Kayıt ekle" uzatılmış düğmesi ekleme iletişim kutusunu açar. Silme onay istemez.
 */
export function PaymentHistoryScreen() {
  useThemeRevision();
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const subscriptions = useSubscriptionsQuery(user?.id);
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);

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
        {(data) => <History payments={data.payments} subscriptions={data.subscriptions} today={today} timeZone={timeZone} />}
      </AsyncStateView>
    </View>
  );
}

function History({ payments, subscriptions, today, timeZone }: { payments: PaymentEvent[]; subscriptions: Subscription[]; today: CivilDate; timeZone: string }) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const names = useMemo(() => new Map(subscriptions.map((item) => [item.id, item.name])), [subscriptions]);
  const listItems = useMemo(() => groupPaymentsByMonth(payments, timeZone), [payments, timeZone]);
  const addable = subscriptions.filter((item) => item.status !== 'archived');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PaymentEvent | null>(null);

  const { add, edit, remove } = usePaymentHistoryActions(today, timeZone, () => setAdding(false), () => setEditing(null));

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
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + sizes.minTouchTarget + spacing.xxxl }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text accessibilityRole="header" style={textStyle('captionStrong', { color: colors.onSurfaceVariant, marginTop: spacing.sm })}>{item.label}</Text>
            ) : (
              <PaymentCard
                payment={item.payment}
                name={names.get(item.payment.subscriptionId ?? '') ?? 'Silinmiş abonelik'}
                dateLabel={`${formatLongDate(localCivilDate(item.payment.paidAt, timeZone))} · ${paymentStatusLabel(item.payment.status)}`}
                onEdit={() => setEditing(item.payment)}
                onDelete={() => remove.mutate(item.payment.id)}
              />
            )
          }
        />
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="Ödeme kaydı ekle" onPress={() => setAdding(true)} style={[styles.fab, { bottom: insets.bottom + spacing.md }]}>
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
  useThemeRevision();
  return (
    <View style={styles.card}>
      <View style={styles.texts}>
        <Text style={textStyle('bodyStrong')}>
          {name}
        </Text>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>{dateLabel}</Text>
      </View>
      <View style={styles.actions}>
      <Text style={textStyle('label', { flex: 1 })}>{formatCurrency(payment.amount, payment.currency)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${formatCurrency(payment.amount, payment.currency)} ödeme kaydını düzenle`}
        accessibilityHint="Ödeme tutarını düzenleme ekranını açar."
        onPress={onEdit}
        style={styles.iconButton}
      >
        <MaterialIcons name="edit" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${formatCurrency(payment.amount, payment.currency)} ödeme kaydını sil`}
        accessibilityHint="Bu ödeme kaydını siler."
        onPress={onDelete}
        style={styles.iconButton}
      >
        <MaterialIcons name="delete-outline" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
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
  },
  separator: {
    height: borderWidth.hairline,
    backgroundColor: colors.border,
  },
  card: {
    paddingVertical: spacing.sm,
  },
  texts: {
    gap: spacing.xxs,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
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
}));
