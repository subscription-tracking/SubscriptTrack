import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthProvider';
import { useOnlineStatus } from '../../../core/network/useOnlineStatus';
import { formatCurrency } from '../../../core/format/money';
import { Money } from '../../../core/domain/money';
import { type CivilDate } from '../../../core/time/calendar';
import { colors, radius, screenGutter, spacing, withAlpha } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { DateField } from '../../../shared/widgets/DateField';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { updatePayment } from '../data/paymentRepository';
import { analyticsKeys } from '../data/queries';
import { type PaymentEvent, localCivilDate, paidAtFromCivil, parsePaymentAmount } from '../domain/paymentEvents';

const OFFLINE_MESSAGE = 'Ödeme düzenlemek için internet bağlantısı gerekir.';

/**
 * Ödeme kaydını düzenleme penceresi. Tutar ve tarih değişir; para birimi ve abonelik sabittir.
 * Düzenleme çevrimiçi yapılır (ödeme kayıtları kuyruğa alınmaz, bkz. API.md).
 */
export function PaymentEditSheet({
  payment,
  name,
  onClose,
}: {
  payment: PaymentEvent | null;
  name: string;
  onClose: () => void;
}) {
  if (!payment) return null;
  return <Editor key={payment.id} payment={payment} name={name} onClose={onClose} />;
}

function Editor({ payment, name, onClose }: { payment: PaymentEvent; name: string; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const online = useOnlineStatus();
  const [amount, setAmount] = useState(payment.amount.decimalString);
  const [date, setDate] = useState<CivilDate>(localCivilDate(payment.paidAt));
  const [amountError, setAmountError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!online) throw new Error(OFFLINE_MESSAGE);
      const money: Money | null = parsePaymentAmount(amount);
      if (!money) throw new Error('Geçerli tutar gir.');
      await updatePayment({ id: payment.id, amount: money.decimalString, paidAt: paidAtFromCivil(date) });
    },
    onSuccess: async () => {
      if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
      snackbar.show('Ödeme kaydı güncellendi.', 'primary');
      onClose();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function submit() {
    if (!parsePaymentAmount(amount)) {
      setAmountError('Geçerli tutar gir');
      return;
    }
    setAmountError(null);
    save.mutate();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={textStyle('title')}>Ödemeyi düzenle</Text>
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
              {name} · para birimi {payment.currency} (değişmez)
            </Text>
            <Spacer size={spacing.md} />
            <TextField
              label={`Tutar (${payment.currency})`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={amountError}
              editable={!save.isPending && online}
            />
            <DateField label="Ödeme tarihi" value={date} fallback={date} onChange={setDate} />
            {!online ? <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{OFFLINE_MESSAGE}</Text> : null}
            <Spacer size={spacing.md} />
            <PrimaryButton label="Kaydet" onPress={submit} loading={save.isPending} disabled={!online} />
            <Spacer size={spacing.xs} />
            <OutlinedButton label="Vazgeç" onPress={onClose} />
            <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
              Güncel tutar: {formatCurrency(payment.amount, payment.currency)}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: withAlpha(colors.background, 0.7),
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.large,
    borderTopRightRadius: radius.large,
  },
  content: {
    padding: screenGutter,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
  },
});
