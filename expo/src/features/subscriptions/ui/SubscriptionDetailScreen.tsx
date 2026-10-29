import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { colors, spacing } from '../../../shared/design/tokens';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { TextLink } from '../../../shared/widgets/TextLink';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { usePaymentsQuery } from '../../stats/data/queries';
import { useSubscriptionQuery } from '../data/queries';
import { type Subscription } from '../domain/subscription';
import { DetailHero } from './detail/DetailHero';
import { DetailMenu, type DetailMenuAction } from './detail/DetailMenu';
import { PaymentCard } from './detail/PaymentCard';
import { DetailInfoList, SummaryBoxes } from './detail/DetailSummary';
import { RecentPayments } from './detail/DetailHistory';
import { useDetailMutations } from './detail/useDetailMutations';
import { useDeletionAction } from './useDeletionAction';

/**
 * Abonelik detayı: kompakt hero (geri, düzenle, ⋯ eylem menüsü), ödeme kartı, özet kutuları, ayrıntı
 * listesi, son ödemeler ve "Nasıl iptal edilir?" düğmesi. Kayıt bulunamazsa "artık mevcut değil" gösterilir.
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
  const router = useRouter();
  const { user } = useAuth();
  const payments = usePaymentsQuery(user?.id);
  const { change, renew, busy } = useDetailMutations(subscription);
  const deletion = useDeletionAction(onBack);
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const subscriptionPayments = payments.data?.filter((event) => event.subscriptionId === subscription.id);
  const [menuOpen, setMenuOpen] = useState(false);

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
    else if (action === 'delete') { if (!deletion.busy) deletion.confirm([subscription.id]); }
    else if (action === 'pause') changeWithConfirmation('paused');
    else if (action === 'resume') changeWithConfirmation('active');
    else changeWithConfirmation('archived');
  }

  const canHowToCancel = subscription.status === 'active' || subscription.status === 'paused';

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
      <DetailHero subscription={subscription} onBack={onBack} onEdit={onEdit} onMenu={() => setMenuOpen(true)} />
      <View style={styles.body}>
        <PaymentCard subscription={subscription} today={today} busy={busy} onRenew={() => renew.mutate()} />
        <SummaryBoxes subscription={subscription} payments={subscriptionPayments} />
        <DetailInfoList subscription={subscription} onEdit={onEdit} />
        <RecentPayments payments={subscriptionPayments} loading={payments.isPending} error={payments.isError} onRetry={() => void payments.refetch()} timeZone={timeZone} onSeeAll={() => router.push('/stats/payments')} />
        {canHowToCancel ? <TonalButton label="Nasıl iptal edilir?" onPress={onCancel} /> : null}
      </View>
    </ScrollView>
      <DetailMenu
        visible={menuOpen}
        name={subscription.name}
        status={subscription.status}
        deleting={deletion.busy}
        onClose={() => setMenuOpen(false)}
        onAction={onMenuAction}
      />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  scroll: { flex: 1 },
}));
