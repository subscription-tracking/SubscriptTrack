import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { deviceTimeZone, zoneToday, type CivilDate } from '../../../core/time/calendar';
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

/**
 * Abonelik detayı (Flutter `SubscriptionDetailScreen`): renkli hero (durum menüsü ve düzenleme), sonraki
 * ödeme kartı, kategori ve sıklık kutuları, ödeme yöntemi, hatırlatmalar, geçmiş ödemeler ve eylemler.
 * Kayıt bulunamazsa "artık mevcut değil" gösterilir.
 */
export function SubscriptionDetailScreen({ id }: { id: string }) {
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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const { change, renew, busy } = useDetailMutations(subscription);
  const today: CivilDate = zoneToday(deviceTimeZone());
  const subscriptionPayments = (payments.data ?? []).filter((event) => event.subscriptionId === subscription.id);

  function onMenuAction(action: DetailMenuAction) {
    if (action === 'cancel') onCancel();
    else if (action === 'pause') change.mutate('paused');
    else if (action === 'resume') change.mutate('active');
    else change.mutate('archived');
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
        <PaymentHistorySection payments={subscriptionPayments} today={today} />
        <Spacer size={spacing.xl + spacing.xs} />
        <DetailActions
          subscription={subscription}
          busy={busy}
          onChange={(to) => change.mutate(to)}
          onRenew={() => renew.mutate()}
          onCancel={onCancel}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
