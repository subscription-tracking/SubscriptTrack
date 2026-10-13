import { useThemeRevision } from '../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../shared/design/themeRuntime';
import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthProvider';
import { type CivilDate, parseCivilDate } from '../../../core/time/calendar';
import { colors, gaps, spacing } from '../../../shared/design/tokens';
import { KeyboardScreen } from '../../../shared/widgets/KeyboardScreen';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { ScreenTopBar } from '../../../shared/widgets/ScreenTopBar';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { saveSubscriptionEdit } from '../data/subscriptionMutations';
import { createSubscriptionWorkflow } from '../data/createSubscriptionWorkflow';
import { DEFAULT_REMINDER_DAYS } from '../domain/reminderRules';
import { submitNotice } from './submitNotice';
import { createNotice } from './createNotice';
import { subscriptionKeys, useServiceCatalogQuery, useSubscriptionsQuery } from '../data/queries';
import { analyticsKeys } from '../../stats/data/queries';
import { formValuesFromSubscription } from '../domain/subscriptionEdit';
import {
  hasDetailsErrors,
  hasDuplicateName,
  hasErrors,
  validateSubscriptionForm,
  type FormErrors,
  type SubscriptionFormValues,
} from '../domain/subscriptionForm';
import { resolveServicePresets } from '../domain/servicePresets';
import { type Subscription } from '../domain/subscription';
import { useActiveCurrency, useUserTimeZone } from '../../settings/data/useActiveCurrency';
import { ServiceSection } from './form/ServiceSection';
import { RenewalSection } from './form/RenewalSection';
import { DetailsSection } from './form/DetailsSection';
import { useCivilToday } from '../../../core/clock/useCivilToday';
import { automaticFormDate, changeFormField, type ScheduleMode } from '../domain/formSchedule';

/**
 * Abonelik formu (Flutter `AddSubscriptionScreen` / `EditSubscriptionScreen` ve `SubscriptionFormScaffold`):
 * ekleme ve düzenleme için ortak ekran. Gövde kaydırılabilir; eylem düğmesi altta sabittir.
 * Kaydetme ve doğrulama kuralları değişmedi; yalnızca düzen Flutter'a göre yeniden kuruldu.
 */
export function SubscriptionFormScreen({ editing, initialStart }: { editing?: Subscription; initialStart?: string }) {
  useThemeRevision();
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const timeZone = useUserTimeZone();
  const today = useCivilToday(timeZone);

  const startDay = parseStartParam(initialStart) ?? today;
  // Yeni kayıt varsayılanı aktif para birimidir; kullanıcı formda değiştirebilir.
  const activeCurrency = useActiveCurrency();

  const [values, setValues] = useState<SubscriptionFormValues>(() =>
    editing
      ? formValuesFromSubscription(editing, today)
      : {
          name: '',
          amount: '',
          currency: activeCurrency,
          billingCycle: 'monthly',
          category: 'other',
          startDate: startDay,
          nextRenewalDate: automaticFormDate({ startDate: startDay, billingCycle: 'monthly' }, today),
          notes: '',
          paymentMethod: '',
          isTrial: false,
          trialEndDate: null,
          trialPrice: '',
          initialPaymentStatus: 'unpaid',
          initialPaymentDate: startDay,
          reminderDays: [...DEFAULT_REMINDER_DAYS],
        },
  );
  const [submitted, setSubmitted] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(editing ? 'manual' : 'automatic');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const submitting = useRef(false);
  const requestKeys = useRef<string[]>([]);
  const catalog = useServiceCatalogQuery();
  // Mevcut liste önbellekten gelir (yeni ağ çağrısı yok); yalnızca ekleme formunda uyarı gösterilir.
  const existing = useSubscriptionsQuery(user?.id);
  const duplicateName = !editing && hasDuplicateName(values.name, existing.data ?? []);
  const resolvedValues = scheduleMode === 'automatic' ? { ...values, nextRenewalDate: automaticFormDate(values, today) } : values;
  const errors: FormErrors = submitted ? validateSubscriptionForm(resolvedValues) : {};

  function update<K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) {
    if (key === 'nextRenewalDate') setScheduleMode('manual');
    if (key === 'startDate' || key === 'billingCycle') setScheduleMode('automatic');
    setValues((current) => changeFormField(current, key, value, today));
  }

  const save = useMutation({
    mutationFn: async () => {
      let index = 0;
      const key = () => requestKeys.current[index] ?? (requestKeys.current[index] = randomUUID());
      const nextKey = () => { const value = key(); index += 1; return value; };
      if (editing && user) {
        return { submission: await saveSubscriptionEdit({ userId: user.id, subscriptionId: editing.id, values: resolvedValues, idempotencyKey: nextKey() }), payment: 'skipped' as const, notices: [] };
      }
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return createSubscriptionWorkflow({ userId: user.id, values: resolvedValues, timeZone, key: nextKey });
    },
    onSuccess: async (result) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      if (user && result.payment === 'saved') await queryClient.invalidateQueries({ queryKey: analyticsKeys.payments(user.id) });
      for (const code of result.notices) {
        const notice = createNotice(code);
        snackbar.show(notice.message, notice.tone);
      }
      const notice = submitNotice(result.submission);
      if (notice) snackbar.show(notice.message, notice.tone);
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
    onSettled: () => { submitting.current = false; },
  });

  function submit() {
    if (submitting.current) return;
    setSubmitted(true);
    const found = validateSubscriptionForm(resolvedValues);
    if (hasErrors(found)) {
      // Kapalı "Ayrıntılar" bölümündeki hata görünmez kalmasın.
      if (hasDetailsErrors(found)) {
        setDetailsOpen(true);
        snackbar.show('Ayrıntılarda düzeltilecek alan var', 'error');
      }
      return;
    }
    submitting.current = true;
    save.mutate();
  }

  const busy = save.isPending;

  return (
    <KeyboardScreen style={styles.screen}>
      <ScreenTopBar title={editing ? 'Aboneliği düzenle' : 'Yeni abonelik'} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ServiceSection
          values={resolvedValues}
          errors={errors}
          presets={resolveServicePresets(catalog.data)}
          showPresets={!editing}
          disabled={busy}
          nameNotice={duplicateName ? 'Aynı isimde bir abonelik zaten var; yine de kaydedebilirsin.' : undefined}
          onChange={update}
        />
        <View style={styles.gapSection} />
        <RenewalSection values={resolvedValues} errors={errors} today={today} onChange={update}
          scheduleMode={scheduleMode} onAutomatic={() => {
            setScheduleMode('automatic');
            setValues((current) => ({ ...current, nextRenewalDate: automaticFormDate(current, today) }));
          }} />
        <View style={styles.gapDetails} />
        <DetailsSection values={resolvedValues} errors={errors} today={today} disabled={busy} showInitialPayment={!editing}
          expanded={detailsOpen} onExpandedChange={setDetailsOpen} onChange={update} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label={editing ? 'Değişiklikleri kaydet' : 'Aboneliği kaydet'} onPress={submit} loading={busy} />
      </View>
    </KeyboardScreen>
  );
}

/** YYYY-AA-GG biçimindeki takvim günü; geçersizse null. */
function parseStartParam(value: string | undefined): CivilDate | null {
  return value ? parseCivilDate(value) : null;
}

const styles = themedStyles(() => StyleSheet.create({
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
}));
