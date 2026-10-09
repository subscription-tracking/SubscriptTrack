import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '../../auth/AuthProvider';
import { deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { sizes, spacing, statusColors } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { changeSubscriptionStatus, confirmOverdueRenewal } from '../data/subscriptionMutations';
import { subscriptionKeys } from '../data/queries';
import { savingsKeys } from '../../savings/data/queries';
import { formatCurrency } from '../../../core/format/money';
import { submitNotice } from './submitNotice';
import { isOverdueRenewal } from '../domain/renewalOverdue';
import { actionsFor, type StatusActionSpec } from '../domain/statusTransitions';
import { monthlyEquivalent, type Subscription, type SubscriptionStatus } from '../domain/subscription';

/**
 * Detay ekranındaki durum aksiyonları ve düzenleme girişi. Her durum değişikliği önce
 * onay penceresi ister; silme aksiyonu yoktur ([ADR 0006](../../../../../docs/decisions/0006-archive-over-delete.md)).
 */
export function SubscriptionStatusActions({
  subscription,
  onEdit,
  onCancel,
}: {
  subscription: Subscription;
  onEdit: () => void;
  /** İptal, tarih isteyen ayrı iptal ekranına yönlendirilir (USER_FLOWS §9). */
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const actions = actionsFor(subscription.status);
  const overdue = isOverdueRenewal(subscription, zoneToday(deviceTimeZone()));

  const change = useMutation({
    mutationFn: (to: SubscriptionStatus) => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({
        userId: user.id,
        subscriptionId: subscription.id,
        to,
        idempotencyKey: randomUUID(),
      });
    },
    onSuccess: async (result, to) => {
      if (user) {
        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
        await queryClient.invalidateQueries({ queryKey: savingsKeys.all(user.id) });
      }
      const notice = submitNotice(result);
      if (notice) {
        snackbar.show(notice.message, notice.tone);
      } else if (to === 'paused' || to === 'cancelled') {
        const annual = monthlyEquivalent(subscription).multiply(12);
        snackbar.show(`Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`, 'primary');
      } else {
        snackbar.show('Durum güncellendi.', 'primary');
      }
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  const renew = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return confirmOverdueRenewal({
        userId: user.id,
        subscriptionId: subscription.id,
        today: zoneToday(deviceTimeZone()),
        idempotencyKey: randomUUID(),
      });
    },
    onSuccess: async (result) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      const notice = submitNotice(result);
      snackbar.show(notice?.message ?? 'Yenileme tarihi güncellendi.', notice?.tone ?? 'primary');
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function confirm(spec: StatusActionSpec) {
    if (spec.action === 'cancel') {
      onCancel();
      return;
    }
    Alert.alert(spec.label, spec.confirmMessage, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: spec.label, style: spec.destructive ? 'destructive' : 'default', onPress: () => change.mutate(spec.target) },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      {overdue ? (
        <>
          <Text style={textStyle('bodySmall', { color: statusColors.warning })}>
            Yenileme tarihi geçti. Yenilendiyse onayla; tarih bir sonraki döneme taşınır.
          </Text>
          <PrimaryButton
            label="Yenilemeyi onayla"
            onPress={() => renew.mutate()}
            loading={renew.isPending}
            disabled={change.isPending}
          />
        </>
      ) : null}
      <OutlinedButton label="Düzenle" onPress={onEdit} minHeight={sizes.primaryButtonHeight} />
      {actions.map((spec) => (
        <OutlinedButton
          key={spec.action}
          label={spec.label}
          onPress={() => confirm(spec)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
});
