import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { colors, sizes, spacing } from '../../../shared/design/tokens';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextLink } from '../../../shared/widgets/TextLink';
import { usePaymentsQuery } from '../../stats/data/queries';
import { useSubscriptionQuery } from '../data/queries';
import { type Subscription } from '../domain/subscription';
import { DetailActions } from './detail/DetailActions';
import { DetailHero, type DetailMenuAction } from './detail/DetailHero';
import { InfoGrid, NextPaymentPanel, PaymentMethodSection, ReminderSection } from './detail/DetailSections';
import { PaymentHistorySection } from './detail/DetailHistory';
import { useDetailMutations } from './detail/useDetailMutations';
import { useDeletionAction } from './useDeletionAction';

/**
 * Abonelik detayı (Flutter `SubscriptionDetailScreen`): renkli hero (durum menüsü ve düzenleme), sonraki
 * ödeme kartı, kategori ve sıklık kutuları, ödeme yöntemi, hatırlatmalar, geçmiş ödemeler ve eylemler.
 * Kayıt bulunamazsa "artık mevcut değil" gösterilir.
 */
export function SubscriptionDetailScreen({ id }: { id: string }) {
  useThemeRevision();
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionQuery(user?.id, id);

  const state: AsyncState<Subscription> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? {
          status: 'error',
          message: 'Abonelik yüklenemedi. Tekrar dene.',
          onRetry: () => void query.refetch(),
        }
      : query.data
        ? { status: 'ready', data: query.data }
        : {
            status: 'empty',
            title: 'Bu abonelik artık mevcut değil',
            description: 'Aboneliği silinmiş ya da erişilemez olabilir.',
            action: <TextLink label="Listeye dön" onPress={() => router.back()} />,
          };

  return (
    <AsyncStateView state={state}>
      {(subscription) => (
        <Details
          subscription={subscription}
          onBack={() => router.back()}
          onEdit={() => router.push(`/subscriptions/${subscription.id}/edit`)}
          onCancel={() => router.push(`/subscriptions/${subscription.id}/cancel`)}
        />
      )}
    </AsyncStateView>
  );
}

function Details({
  subscription,
  onBack,
  onEdit,
  onCancel,
}: {
  subscription: Subscription;
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  useThemeRevision();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const { change, renew, busy } = useDetailMutations(subscription);
  const deletion = useDeletionAction(onBack);
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const subscriptionPayments = (payments.data ?? []).filter((event) => event.subscriptionId === subscription.id);

  function changeWithConfirmation(to: Subscription['status']) {
    if (subscription.status === 'cancelled' && to === 'active') {
      Alert.alert('Aboneliği yeniden etkinleştir', 'Yenileme takibi yeniden başlasın mı? Geçmiş tasarruf kaydı korunur.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yeniden etkinleştir', onPress: () => change.mutate(to) },
      ]);
      return;
    }
    change.mutate(to);
  }

  function onMenuAction(action: DetailMenuAction) {
    if (action === 'cancel') onCancel();
    else if (action === 'pause') changeWithConfirmation('paused');
    else if (action === 'resume') changeWithConfirmation('active');
    else changeWithConfirmation('archived');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: sizes.bottomNavHeight + insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
      <DetailHero subscription={subscription} onBack={onBack} onEdit={onEdit} onMenuAction={onMenuAction} />
      <View style={styles.body}>
        <NextPaymentPanel subscription={subscription} today={today} />
        <Spacer size={spacing.md} />
        <InfoGrid subscription={subscription} />
        <PaymentMethodSection method={subscription.paymentMethod} onChange={onEdit} />
        <ReminderSection rules={subscription.notificationRules} onEdit={onEdit} />
        <PaymentHistorySection payments={subscriptionPayments} timeZone={timeZone} />
        <Spacer size={spacing.xl + spacing.xs} />
        <DetailActions
          subscription={subscription}
          busy={busy}
          onChange={changeWithConfirmation}
          onRenew={() => renew.mutate()}
          onCancel={onCancel}
        />
        <Spacer size={spacing.md} />
        <TextLink tone="danger" label={deletion.busy ? 'Siliniyor…' : 'Aboneliği sil'} onPress={() => { if (!deletion.busy) deletion.confirm([subscription.id]); }} />
      </View>
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
}));
