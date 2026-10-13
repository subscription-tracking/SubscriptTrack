import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { useState, type ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { formatCurrency } from '../../../core/format/money';
import { formatLongDate } from '../../../core/format/date';
import { type CivilDate, formatCivilDate, } from '../../../core/time/calendar';
import { borderWidth, colors, radius, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { AsyncStateView, type AsyncState } from '../../../shared/widgets/AsyncStateView';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { DateField } from '../../../shared/widgets/DateField';
import { OutlinedButton } from '../../../shared/widgets/OutlinedButton';
import { TonalButton } from '../../../shared/widgets/TonalButton';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenBottomInset } from '../../../shared/widgets/ScreenBottomInset';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { Spacer } from '../../../shared/widgets/Spacer';
import { useSubscriptionQuery } from '../data/queries';
import { useCancellationAction } from './useCancellationAction';
import { canTransition } from '../domain/statusTransitions';
import {
  cancellationPayload,
  hasCancellationErrors,
  providerCancelUrl,
  validateCancellation,
  type CancellationErrors,
} from '../domain/cancellation';
import { monthlyEquivalent, type Subscription } from '../domain/subscription';

/**
 * İptal seçenekleri ([USER_FLOWS §9](../../../../../docs/product/USER_FLOWS.md)): sağlayıcı sayfası,
 * "İptal ettim" (tarihlerle), "Durdurdum" ve "Kullanmaya devam et". İptal sebebi alınmaz:
 * saklanacak bir yer yok ve kişisel not analitiğe gönderilmemeli.
 */
export function SubscriptionCancelScreen({ id }: { id: string }) {
  useThemeRevision();
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
      <ScreenTopBar title="Aboneliği iptal et" />
      <AsyncStateView state={state}>{(subscription) => <Choices subscription={subscription} />}</AsyncStateView>
    </View>
  );
}

function Choices({ subscription }: { subscription: Subscription }) {
  useThemeRevision();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const providerUrl = providerCancelUrl(subscription.website);
  const canPause = canTransition(subscription.status, 'paused');
  const canCancel = canTransition(subscription.status, 'cancelled');
  const annual = monthlyEquivalent(subscription).multiply(12);

  const pause = useCancellationAction(subscription, 'paused', `Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`);

  if (showForm && canCancel) {
    return (
      <CancelForm subscription={subscription} onBack={() => setShowForm(false)} />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={textStyle('heading')}>Ne yapmak istiyorsun?</Text>
      <Text style={textStyle('bodyStrong')}>{subscription.name}</Text>
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
        Tahmini yıllık tasarruf: {formatCurrency(annual, subscription.currency)}
      </Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="open-in-new" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
          <Text style={textStyle('bodyStrong')}>Sağlayıcı sayfası</Text>
        </View>
        {providerUrl ? (
          <TonalButton label="Sağlayıcı iptal sayfasını aç" onPress={() => void Linking.openURL(providerUrl)} />
        ) : (
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
            Kayıtlı bir web sitesi yok. Sağlayıcının iptal sayfasını kendin açıp ardından &quot;İptal ettim&quot; seçeneğini kullan.
          </Text>
        )}
      </View>

      <Spacer size={spacing.md} />
      {canCancel ? (
        <Choice icon="cancel" label="İptal ettim" description="İptal tarihini ve varsa erişim bitişini kaydet." onPress={() => setShowForm(true)} />
      ) : null}
      {canPause ? (
        <Choice icon="pause-circle-outline" label="Durdurdum" description="Aboneliği duraklat; kayıt listede kalır." onPress={() => pause.mutate(undefined)} disabled={pause.isPending} />
      ) : null}
      <Choice icon="check-circle-outline" label="Kullanmaya devam et" description="Hiçbir şey değişmez." onPress={() => router.back()} />
      <ScreenBottomInset />
    </ScrollView>
  );
}

function Choice({ icon, label, description, onPress, disabled = false }: { icon: ComponentProps<typeof MaterialIcons>['name']; label: string; description: string; onPress: () => void; disabled?: boolean }) {
  useThemeRevision();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <MaterialIcons name={icon} size={sizes.iconButtonSize} color={colors.primary} />
      <View style={styles.choiceText}>
        <Text style={textStyle('bodyStrong')}>{label}</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

function CancelForm({ subscription, onBack }: { subscription: Subscription; onBack: () => void }) {
  useThemeRevision();
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);
  const [cancelledOn, setCancelledOn] = useState<CivilDate>(today);
  const [hasAccessEnd, setHasAccessEnd] = useState(false);
  const [accessEndsOn, setAccessEndsOn] = useState<CivilDate | null>(null);
  const [errors, setErrors] = useState<CancellationErrors>({});
  const annual = monthlyEquivalent(subscription).multiply(12);

  const save = useCancellationAction(subscription, 'cancelled', `İptal kaydedildi. Tahmini yıllık tasarruf: ${formatCurrency(annual, subscription.currency)}`);

  function submit() {
    const next = validateCancellation({ cancelledOn, accessEndsOn: hasAccessEnd ? accessEndsOn : null }, today);
    if (hasAccessEnd && !accessEndsOn) next.accessEndsOn = 'Erişim bitiş tarihini seç';
    setErrors(next);
    if (hasCancellationErrors(next)) return;
    save.mutate(cancellationPayload({ cancelledOn, accessEndsOn: hasAccessEnd ? accessEndsOn : null }, formatCivilDate));
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={textStyle('bodyStrong')}>İptal ettim</Text>
        <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>
          Sağlayıcıda iptal ettiğin tarihi gir. Durum &quot;İptal edildi&quot; olur ve tasarruf listesine eklenir.
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
      <ScreenBottomInset />
    </ScrollView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  choiceText: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
}));
