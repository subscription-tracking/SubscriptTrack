import { type ReactNode, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '../../auth/AuthProvider';
import { type BillingCycle, type CivilDate, zoneToday } from '../../../core/time/calendar';
import { colors, screenGutter, sizes, spacing } from '../../../shared/design/tokens';
import { textStyle } from '../../../shared/design/typography';
import { CheckboxRow } from '../../../shared/widgets/CheckboxRow';
import { ChoiceChips, type ChoiceOption } from '../../../shared/widgets/ChoiceChips';
import { DateField } from '../../../shared/widgets/DateField';
import { PrimaryButton } from '../../../shared/widgets/PrimaryButton';
import { Spacer } from '../../../shared/widgets/Spacer';
import { TextField } from '../../../shared/widgets/TextField';
import { useSnackbar } from '../../../shared/widgets/AppSnackbar';
import { saveSubscriptionEdit, submitCreate } from '../data/subscriptionMutations';
import { submitNotice } from './submitNotice';
import { subscriptionKeys } from '../data/queries';
import { FORM_BILLING_CYCLES, FORM_CURRENCIES, type FormErrors, type SubscriptionFormValues, hasErrors, toCreatePayload, validateSubscriptionForm } from '../domain/subscriptionForm';
import { formValuesFromSubscription } from '../domain/subscriptionEdit';
import { resolveServicePresets } from '../domain/servicePresets';
import { useServiceCatalogQuery } from '../data/queries';
import { ServiceSuggestions } from './ServiceSuggestions';
import { BILLING_CYCLE_LABELS, CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES, type Subscription, type SubscriptionCategory } from '../domain/subscription';

const CATEGORY_OPTIONS: ChoiceOption<SubscriptionCategory>[] = SUBSCRIPTION_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

const CYCLE_OPTIONS: ChoiceOption<BillingCycle>[] = FORM_BILLING_CYCLES.map((value) => ({
  value,
  label: BILLING_CYCLE_LABELS[value],
}));

/** Düzenlemede kayıtlı para birimi listede yoksa yine de gösterilir; değer sessizce değişmez. */
function currencyOptions(current: string): ChoiceOption<string>[] {
  const values = (FORM_CURRENCIES as readonly string[]).includes(current) ? FORM_CURRENCIES : [...FORM_CURRENCIES, current];
  return values.map((value) => ({ value, label: value }));
}

/**
 * Abonelik formu: ekleme (`editing` yok) ve düzenleme (`editing` var) için ortak ekran.
 * Hazır servis listesi ve ilk ödeme sonraki adımda.
 */
export function SubscriptionFormScreen({ editing }: { editing?: Subscription }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { user } = useAuth();
  const today = useMemo<CivilDate>(() => zoneToday(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'), []);

  const [values, setValues] = useState<SubscriptionFormValues>(() =>
    editing
      ? formValuesFromSubscription(editing, today)
      : {
          name: '',
          amount: '',
          currency: 'TRY',
          billingCycle: 'monthly',
          category: 'other',
          startDate: today,
          nextRenewalDate: today,
          notes: '',
          paymentMethod: '',
          isTrial: false,
          trialEndDate: null,
          trialPrice: '',
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
        return saveSubscriptionEdit({
          userId: user.id,
          subscriptionId: editing.id,
          values,
          idempotencyKey: randomUUID(),
        });
      }
      if (!user) throw new Error('Oturum bulunamadı. Yeniden giriş yap.');
      return submitCreate(user.id, toCreatePayload(values, randomUUID()));
    },
    onSuccess: async (result) => {
      if (user) await queryClient.invalidateQueries({ queryKey: subscriptionKeys.all(user.id) });
      const notice = submitNotice(result);
      if (notice) snackbar.show(notice.message, notice.tone);
      router.back();
    },
    onError: (error: Error) => snackbar.show(error.message, 'error'),
  });

  function submit() {
    setSubmitted(true);
    if (hasErrors(validateSubscriptionForm(values))) return;
    save.mutate();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Text style={textStyle('title')}>{editing ? 'Aboneliği düzenle' : 'Yeni abonelik'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TextField
          label="Servis"
          placeholder="Örn. Netflix"
          value={values.name}
          onChangeText={(v) => update('name', v)}
          error={errors.name}
          maxLength={160}
          editable={!save.isPending}
        />
        {editing ? null : (
          <ServiceSuggestions
            query={values.name}
            presets={resolveServicePresets(catalog.data)}
            onPick={(preset) => setValues((current) => ({ ...current, name: preset.name, category: preset.category }))}
          />
        )}
        <Spacer size={spacing.md} />

        <TextField
          label="Tutar"
          value={values.amount}
          onChangeText={(v) => update('amount', v)}
          error={errors.amount}
          keyboardType="decimal-pad"
          editable={!save.isPending}
        />
        <Spacer size={spacing.sm} />
        <ChoiceChips options={currencyOptions(values.currency)} value={values.currency} onChange={(v) => update('currency', v)} />
        <Spacer size={spacing.md} />

        <Section title="Yenileme sıklığı">
          <ChoiceChips options={CYCLE_OPTIONS} value={values.billingCycle} onChange={(v) => update('billingCycle', v)} />
        </Section>

        <DateField
          label="Başlangıç tarihi"
          value={values.startDate}
          fallback={today}
          onChange={(v) => update('startDate', v)}
        />
        <Spacer size={spacing.md} />
        <DateField
          label="Sonraki yenileme"
          value={values.nextRenewalDate}
          fallback={today}
          error={errors.nextRenewalDate}
          onChange={(v) => update('nextRenewalDate', v)}
        />
        <Spacer size={spacing.md} />

        <Section title="Kategori">
          <ChoiceChips options={CATEGORY_OPTIONS} value={values.category} onChange={(v) => update('category', v)} />
        </Section>

        <CheckboxRow checked={values.isTrial} onChange={(v) => update('isTrial', v)}>
          <Text style={textStyle('bodySmall')}>Ücretsiz deneme</Text>
        </CheckboxRow>
        {values.isTrial ? (
          <>
            <Spacer size={spacing.md} />
            <DateField
              label="Deneme bitiş tarihi"
              value={values.trialEndDate}
              fallback={today}
              error={errors.trialEndDate}
              onChange={(v) => update('trialEndDate', v)}
            />
            <Spacer size={spacing.md} />
            <TextField
              label="Deneme sonrası fiyat"
              value={values.trialPrice}
              onChangeText={(v) => update('trialPrice', v)}
              error={errors.trialPrice}
              keyboardType="decimal-pad"
            />
          </>
        ) : null}
        <Spacer size={spacing.md} />

        <TextField
          label="Ödeme yöntemi (isteğe bağlı)"
          value={values.paymentMethod}
          onChangeText={(v) => update('paymentMethod', v)}
          error={errors.paymentMethod}
          maxLength={80}
        />
        <Spacer size={spacing.md} />
        <TextField
          label="Notlar (isteğe bağlı)"
          value={values.notes}
          onChangeText={(v) => update('notes', v)}
          error={errors.notes}
          multiline
        />
        <Spacer size={spacing.xl} />

        <PrimaryButton label={editing ? 'Değişiklikleri kaydet' : 'Aboneliği kaydet'} onPress={submit} loading={save.isPending} />
        <Spacer size={spacing.xl} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={textStyle('label', { color: colors.onSurfaceVariant })}>{title}</Text>
      <Spacer size={spacing.xs} />
      {children}
    </View>
  );
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
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.xxs,
  },
});
