import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate, deviceTimeZone, formatCivilDate, zoneToday } from '../../../core/time/calendar';
import { colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { DateField } from '../../../shared/widgets/DateField';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { savingsKeys } from '../../savings/data/queries';
import { subscriptionKeys, useSubscriptionQuery } from '../data/queries';
import { changeSubscriptionStatus } from '../data/subscriptionMutations';
import { canTransition } from '../domain/statusTransitions';
import {
  cancellationPayload,
  hasCancellationErrors,
  providerCancelUrl,
  validateCancellation,
  type CancellationErrors,
} from '../domain/cancellation';
import { monthlyEquivalent, type Subscription } from '../domain/subscription';
import { type SubmitResult } from '../data/subscriptionSync';

/**
 * İptal seçenekleri ([USER_FLOWS §9](../../../../../docs/product/USER_FLOWS.md)): sağlayıcı sayfası,
 * "İptal ettim" (tarihlerle), "Durdurdum" ve "Kullanmaya devam et". İptal sebebi alınmaz:
 * saklanacak bir yer yok ve kişisel not analitiğe gönderilmemeli.
 */
export function SubscriptionCancelScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const query = useSubscriptionQuery(user?.id, id);

  const state: AsyncState<Subscription> = query.isPending
    ? { status: 'loading' }
    : query.isError
      ? { status: 'error', message: 'Abonelik yüklenemedi. Tekrar dene.', onRetry: () => void query.refetch() }
      : query.data
        ? { status: 'ready', data: query.data }
        : {
            status: 'empty',
            title: 'Bu abonelik artık mevcut değil',
            description: 'Aboneliği silinmiş ya da erişilemez olabilir.',
          };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>Aboneliği iptal et</Text>
      </View>
      <Spacer size={spacing.md} />
      <AsyncStateView state={state}>{(subscription) => <Choices subscription={subscription} />}</AsyncStateView>
    </View>
  );
}

function Choices({ subscription }: { subscription: Subscription }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const [showForm, setShowForm] = useState(false);
  const providerUrl = providerCancelUrl(subscription.website);
  const canPause = canTransition(subscription.status, 'paused');
  const canCancel = canTransition(subscription.status, 'cancelled');
  const annual = monthlyEquivalent(subscription).multiply(12);

  const pause = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({ userId: user.id, subscriptionId: subscription.id, to: 'paused', idempotencyKey: randomUUID() });
    },
    onSuccess: async (result) => {
      await invalidate(queryClient, user?.id);
      snackbar.show(savingsMessage(result, `Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`), 'primary');
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  if (showForm && canCancel) {
    return (
      <CancelForm subscription={subscription} onBack={() => setShowForm(false)} />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={textStyle('titleSmall')}>{subscription.name}</Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Tahmini yıllık tasarruf: {formatCurrency(annual, subscription.currency)}
      </Text>

      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>Sağlayıcı sayfası</Text>
        {providerUrl ? (
          <OutlinedButton label="Sağlayıcı iptal sayfasını aç" onPress={() => void Linking.openURL(providerUrl)} />
        ) : (
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
            Kayıtlı bir web sitesi yok. Sağlayıcının iptal sayfasını kendin açıp ardından "İptal ettim" seçeneğini kullan.
          </Text>
        )}
      </View>

      <Spacer size={spacing.md} />
      {canCancel ? (
        <Choice label="İptal ettim" description="İptal tarihini ve varsa erişim bitişini kaydet." onPress={() => setShowForm(true)} />
      ) : null}
      {canPause ? (
        <Choice label="Durdurdum" description="Aboneliği duraklat; kayıt listede kalır." onPress={() => pause.mutate()} />
      ) : null}
      <Choice label="Kullanmaya devam et" description="Hiçbir şey değişmez." onPress={() => router.back()} />
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

function Choice({ label, description, onPress }: { label: string; description: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
      <View style={styles.choiceText}>
        <Text style={textStyle('titleSmall')}>{label}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function CancelForm({ subscription, onBack }: { subscription: Subscription; onBack: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);
  const [cancelledOn, setCancelledOn] = useState<CivilDate>(today);
  const [hasAccessEnd, setHasAccessEnd] = useState(false);
  const [accessEndsOn, setAccessEndsOn] = useState<CivilDate | null>(null);
  const [errors, setErrors] = useState<CancellationErrors>({});
  const annual = monthlyEquivalent(subscription).multiply(12);

  const save = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return changeSubscriptionStatus({
        userId: user.id,
        subscriptionId: subscription.id,
        to: 'cancelled',
        idempotencyKey: randomUUID(),
        eventExtra: cancellationPayload({ cancelledOn, accessEndsOn: hasAccessEnd ? accessEndsOn : null }, formatCivilDate),
      });
    },
    onSuccess: async (result) => {
      await invalidate(queryClient, user?.id);
      snackbar.show(savingsMessage(result, `İptal kaydedildi. Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`), 'primary');
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function submit() {
    const next = validateCancellation({ cancelledOn, accessEndsOn: hasAccessEnd ? accessEndsOn : null }, today);
    if (hasAccessEnd && !accessEndsOn) next.accessEndsOn = 'Erişim bitiş tarihini seç';
    setErrors(next);
    if (hasCancellationErrors(next)) return;
    save.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={textStyle('titleSmall')}>İptal ettim</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Sağlayıcıda iptal ettiğin tarihi gir. Durum "İptal edildi" olur ve tasarruf listesine eklenir.
        </Text>
        <DateField label="İptal tarihi" value={cancelledOn} fallback={today} error={errors.cancelledOn} onChange={setCancelledOn} />
        <CheckboxRow checked={hasAccessEnd} onChange={setHasAccessEnd}>
          <Text style={textStyle('bodySmall')}>Servise erişim bir tarihte bitiyor</Text>
        </CheckboxRow>
        {hasAccessEnd ? (
          <DateField label="Erişim bitiş tarihi" value={accessEndsOn} fallback={cancelledOn} error={errors.accessEndsOn} onChange={setAccessEndsOn} />
        ) : null}
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Yenileme tarihi {subscription.nextRenewalDate ? formatLongDate(subscription.nextRenewalDate) : 'bilinmiyor'}; iptal sonrası yenilenmez.
        </Text>
        <PrimaryButton label="İptali kaydet" onPress={submit} loading={save.isPending} />
        <OutlinedButton label="Geri dön" onPress={onBack} />
      </View>
      <Spacer size={sizes.bottomNavHeight} />
    </ScrollView>
  );
}

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined): Promise<void> {
  if (!userId) return;
  await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(userId) });
  await queryClient.invalidateQueries({ queryKey: savingsKeys.all(userId) });
}

/** Kuyruğa girdiyse bunu, aksi halde tasarruf mesajını gösterir. */
function savingsMessage(result: SubmitResult, savedMessage: string): string {
  return result.status === 'queued' ? 'Bağlantı yok. Değişiklik bağlantı gelince gönderilecek.' : savedMessage;
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
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.outline,
  },
  choiceText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
