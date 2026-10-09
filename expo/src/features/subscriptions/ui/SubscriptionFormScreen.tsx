import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate, civilDate, deviceTimeZone, zoneToday } from '../../../core/time/calendar';
import { colors, gaps, spacing } from '../../../shared/design/tokens';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { saveSubscriptionEdit, submitCreate } from '../data/subscriptionMutations';
import { type SubmitResult } from '../data/subscriptionSync';
import { submitNotice } from './submitNotice';
import { subscriptionKeys, useServiceCatalogQuery } from '../data/queries';
import { analyticsKeys } from '../../stats/data/queries';
import { recordPayment } from '../../stats/data/paymentRepository';
import { paidAtFromCivil } from '../../stats/domain/paymentEvents';
import { formValuesFromSubscription } from '../domain/subscriptionEdit';
import {
  hasErrors,
  toCreatePayload,
  toSubscriptionFields,
  validateSubscriptionForm,
  type FormErrors,
  type SubscriptionFormValues,
} from '../domain/subscriptionForm';
import { resolveServicePresets } from '../domain/servicePresets';
import { type Subscription } from '../domain/subscription';
import { ServiceSection } from './form/ServiceSection';
import { RenewalSection } from './form/RenewalSection';
import { DetailsSection } from './form/DetailsSection';

/**
 * Abonelik formu (Flutter `AddSubscriptionScreen` / `EditSubscriptionScreen` ve `SubscriptionFormScaffold`):
 * ekleme ve düzenleme için ortak ekran. Gövde kaydırılabilir; eylem düğmesi altta sabittir.
 * Kaydetme ve doğrulama kuralları değişmedi; yalnızca düzen Flutter'a göre yeniden kuruldu.
 */
export function SubscriptionFormScreen({ editing, initialStart }: { editing?: Subscription; initialStart?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const today = useMemo<CivilDate>(() => zoneToday(deviceTimeZone()), []);

  const startDay = parseStartParam(initialStart) ?? today;

  const [values, setValues] = useState<SubscriptionFormValues>(() =>
    editing
      ? formValuesFromSubscription(editing, today)
      : {
          name: '',
          amount: '',
          currency: 'TRY',
          billingCycle: 'monthly',
          category: 'other',
          startDate: startDay,
          nextRenewalDate: startDay,
          notes: '',
          paymentMethod: '',
          isTrial: false,
          trialEndDate: null,
          trialPrice: '',
          initialPaid: false,
          initialPaymentDate: startDay,
        },
  );
  const [submitted, setSubmitted] = useState(false);
  const catalog = useServiceCatalogQuery();
  const errors: FormErrors = submitted ? validateSubscriptionForm(values) : {};

  function update<K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const save = useMutation({
    mutationFn: async () => {
      if (editing && user) {
        return saveSubscriptionEdit({ userId: user.id, subscriptionId: editing.id, values, idempotencyKey: randomUUID() });
      }
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return submitCreate(user.id, toCreatePayload(values, randomUUID()));
    },
    onSuccess: async (result) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      if (!editing && values.initialPaid) await recordInitialPayment(result);
      const notice = submitNotice(result);
      if (notice) snackbar.show(notice.message, notice.tone);
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  /**
   * "Ödendi" seçili ekleme: kayıt çevrimiçi hemen gönderildiyse ödeme kaydı yazılır. Kuyruğa alındıysa kimlik
   * henüz yoktur; ödeme RPC'si kuyruğa alınmaz (API §4), bu yüzden kullanıcı ödeme geçmişinden ekler.
   */
  async function recordInitialPayment(result: SubmitResult) {
    if (!result.createdId) {
      snackbar.show('İlk ödeme bağlantı gelince eklenmez; ödeme geçmişinden ekleyebilirsin.', 'default');
      return;
    }
    const fields = toSubscriptionFields(values);
    try {
      await recordPayment({
        idempotencyKey: randomUUID(),
        subscriptionId: result.createdId,
        amount: fields.p_amount,
        currency: fields.p_currency,
        paidAt: paidAtFromCivil(values.initialPaymentDate),
      });
      if (user) await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
    } catch {
      snackbar.show('Abonelik kaydedildi ama ilk ödeme eklenemedi. Ödeme geçmişinden ekleyebilirsin.', 'error');
    }
  }

  function submit() {
    setSubmitted(true);
    if (hasErrors(validateSubscriptionForm(values))) return;
    save.mutate();
  }

  const busy = save.isPending;

  return (
    <View style={styles.screen}>
      <ScreenTopBar title={editing ? 'Aboneliği düzenle' : 'Yeni abonelik'} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ServiceSection
          values={values}
          errors={errors}
          presets={resolveServicePresets(catalog.data)}
          showPresets={!editing}
          disabled={busy}
          onChange={update}
        />
        <View style={styles.gapSection} />
        <RenewalSection values={values} errors={errors} today={today} onChange={update} />
        <View style={styles.gapDetails} />
        <DetailsSection values={values} errors={errors} today={today} disabled={busy} showInitialPayment={!editing} onChange={update} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label={editing ? 'Değişiklikleri kaydet' : 'Aboneliği kaydet'} onPress={submit} loading={busy} />
      </View>
    </View>
  );
}

/** YYYY-AA-GG biçimindeki takvim günü; geçersizse null. */
function parseStartParam(value: string | undefined): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = civilDate(year, month, day);
  return date.month === month && date.day === day ? date : null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: gaps.sectionTop * 5,
  },
  gapSection: {
    height: spacing.md,
  },
  gapDetails: {
    height: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + spacing.xxs / 2,
  },
});
