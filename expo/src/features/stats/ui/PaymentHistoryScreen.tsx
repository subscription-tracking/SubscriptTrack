import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { Money } from '../../../core/domain/money';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate, formatMonthYear } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { DateField } from '../../../shared/widgets/DateField';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSubscriptionsQuery } from '../../subscriptions/data/queries';
import { type Subscription } from '../../subscriptions/domain/subscription';
import { analyticsKeys, usePaymentsQuery } from '../data/queries';
import { deletePayment, recordPayment } from '../data/paymentRepository';
import { type PaymentEvent, localCivilDate } from '../domain/paymentEvents';
import { PaymentEditSheet } from './PaymentEditSheet';

const OFFLINE_MESSAGE = 'Ödeme kaydı için internet bağlantısı gerekir.';

/** Ödeme geçmişi: aya göre gruplu liste, ödeme ekleme ve silme. Düzenleme sonraki sürümde. */
export function PaymentHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const subscriptions = useSubscriptionsQuery(user?.id);

  const state: AsyncState<PaymentEvent[]> = payments.isPending || subscriptions.isPending
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
      : { status: 'ready', data: payments.data ?? [] };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Ödeme geçmişi</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>
        {(items) => (
          <History
            payments={items}
            subscriptions={subscriptions.data ?? []}
          />
        )}
      </AsyncStateView>
    </View>
  );
}

function History({ payments, subscriptions }: { payments: PaymentEvent[]; subscriptions: Subscription[] }) {
  const names = useMemo(() => new Map(subscriptions.map((item) => [item.id, item.name])), [subscriptions]);
  const groups = useMemo(() => groupByMonth(payments), [payments]);
  const [editing, setEditing] = useState<PaymentEvent | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AddPayment subscriptions={subscriptions.filter((item) => item.status === 'active' || item.status === 'trial')} />
      <Spacer size={spacing.md} />

      {payments.length === 0 ? (
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Henüz ödeme kaydı yok. Ödemelerini ekledikçe trend ve kategori analizleri güncellenir.
        </Text>
      ) : null}

      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{group.title}</Text>
          {group.items.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              name={names.get(payment.subscriptionId ?? '') ?? 'Silinmiş abonelik'}
              onEdit={() => setEditing(payment)}
            />
          ))}
        </View>
      ))}
      <Spacer size={sizes.bottomNavHeight} />
      <PaymentEditSheet
        payment={editing}
        name={names.get(editing?.subscriptionId ?? '') ?? 'Silinmiş abonelik'}
        onClose={() => setEditing(null)}
      />
    </ScrollView>
  );
}

function PaymentRow({ payment, name, onEdit }: { payment: PaymentEvent; name: string; onEdit: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const online = useOnlineStatus();
  const remove = useMutation({
    mutationFn: () => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      return deletePayment(payment.id);
    },
    onSuccess: async () => {
      if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
      snackbar.show('Ödeme kaydı silindi.', 'default');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function confirm() {
    Alert.alert('Ödeme kaydı silinsin mi?', `${name} · ${formatCurrency(payment.amount, payment.currency)}`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  const paidAt = localCivilDate(payment.paidAt);
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${name} ödemesini düzenle`} onPress={onEdit} style={styles.rowText}>
        <Text style={textStyle('titleSmall')}>{name}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{formatLongDate(paidAt)}</Text>
      </Pressable>
      <Text style={textStyle('titleSmall', { color: colors.primary })}>{formatCurrency(payment.amount, payment.currency)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ödeme kaydını sil" onPress={confirm} style={styles.deleteButton}>
        <MaterialIcons name="delete-outline" size={22} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

function AddPayment({ subscriptions }: { subscriptions: Subscription[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const online = useOnlineStatus();
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const [subscriptionId, setSubscriptionId] = useState<string | null>(subscriptions[0]?.id ?? null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<CivilDate>(today);
  const [errors, setErrors] = useState<{ amount?: string; subscription?: string }>({});

  const options: ChoiceOption<string>[] = subscriptions.map((item) => ({ value: item.id, label: item.name }));
  const selected = subscriptions.find((item) => item.id === subscriptionId) ?? null;

  const save = useMutation({
    mutationFn: async () => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      if (!selected || !user) throw new Error('Abonelik seç.');
      const money = Money.tryParse(amount);
      if (!money) throw new Error('Geçerli tutar gir.');
      const paidAt = new Date(date.year, date.month - 1, date.day, 12, 0, 0);
      await recordPayment({
        idempotencyKey: randomUUID(),
        subscriptionId: selected.id,
        amount: money.decimalString,
        currency: selected.currency,
        paidAt,
      });
    },
    onSuccess: async () => {
      if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
      setAmount('');
      snackbar.show('Ödeme kaydedildi.', 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function submit() {
    const next: { amount?: string; subscription?: string } = {};
    if (!selected) next.subscription = 'Abonelik seç';
    const money = Money.tryParse(amount);
    if (!money || money.compareTo(Money.zero) <= 0) next.amount = 'Geçerli tutar gir';
    setErrors(next);
    if (next.amount || next.subscription) return;
    save.mutate();
  }

  if (subscriptions.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>
          Ödeme eklemek için önce aktif bir abonelik ekle.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={textStyle('titleSmall')}>Ödeme ekle</Text>
      {!online ? <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{OFFLINE_MESSAGE}</Text> : null}
      <ChoiceChips options={options} value={subscriptionId ?? ''} onChange={(value) => setSubscriptionId(value)} />
      {errors.subscription ? <Text style={textStyle('caption', { color: colors.error })}>{errors.subscription}</Text> : null}
      <TextField
        label={`Tutar${selected ? ` (${selected.currency})` : ''}`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        error={errors.amount}
        editable={!save.isPending && online}
      />
      <DateField label="Ödeme tarihi" value={date} fallback={today} onChange={setDate} />
      <PrimaryButton label="Ödemeyi kaydet" onPress={submit} loading={save.isPending} disabled={!online} />
    </View>
  );
}

function groupByMonth(payments: PaymentEvent[]): { key: string; title: string; items: PaymentEvent[] }[] {
  const groups = new Map<string, { key: string; title: string; items: PaymentEvent[] }>();
  for (const payment of payments) {
    const civil = localCivilDate(payment.paidAt);
    const key = `${civil.year}-${civil.month}`;
    const group = groups.get(key) ?? { key, title: formatMonthYear(civil.year, civil.month), items: [] };
    group.items.push(payment);
    groups.set(key, group);
  }
  return [...groups.values()];
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
  content: {
    paddingHorizontal: screenGutter,
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
    gap: spacing.sm,
  },
  group: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  deleteButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
