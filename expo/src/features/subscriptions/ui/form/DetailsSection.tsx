import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { type CivilDate } from '../../../../core/time/calendar';
import { colors, gaps, sizes, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import { SelectField } from '../../../../shared/widgets/SelectField';
import { TextField } from '../../../../shared/widgets/TextField';
import { CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../../domain/subscription';
import { type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';

const NOTES_MAX_LENGTH = 500;

/**
 * Flutter `FormDetailsSection`: "Diğer ayrıntılar" açılır satırı. Açıkken deneme anahtarı (ve bitiş tarihi,
 * deneme sonrası fiyat), kategori, ödeme yöntemi, başlangıç tarihi ve not alanları görünür.
 * İlk ödeme yalnızca ekleme formunda; "Ödendi" seçilirse ödeme kaydı eklenir. Flutter'daki "Ertelendi" durumu
 * `record_payment_idempotent` RPC'sinde alan olmadığı için bu sürümde yoktur.
 */
export function DetailsSection({
  values,
  errors,
  today,
  disabled,
  showInitialPayment,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  disabled: boolean;
  /** Yalnızca ekleme formunda: ilk ödeme anahtarı ve tarihi. */
  showInitialPayment: boolean;
  onChange: <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={() => setExpanded((open) => !open)} style={styles.toggle}>
        <MaterialIcons name="tune" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
        <View style={styles.toggleText}>
          <Text style={textStyle('body')}>Diğer ayrıntılar</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Kategori, deneme, ödeme yöntemi ve not</Text>
        </View>
        <MaterialIcons name={expanded ? 'expand-less' : 'chevron-right'} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>

      {expanded ? (
        <View style={styles.fields}>
          <View style={styles.trialRow}>
            <View style={styles.trialText}>
              <Text style={textStyle('body')}>Ücretsiz deneme</Text>
              <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Deneme bitince ücret alınmaya başlar</Text>
            </View>
            <Switch
              value={values.isTrial}
              disabled={disabled}
              onValueChange={(next) => onChange('isTrial', next)}
              trackColor={{ false: colors.outline, true: withAlpha(colors.primary, 0.5) }}
              thumbColor={values.isTrial ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
          {values.isTrial ? (
            <>
              <DateField
                label="Deneme bitiş tarihi"
                icon="hourglass-bottom"
                value={values.trialEndDate}
                fallback={today}
                error={errors.trialEndDate}
                onChange={(next) => onChange('trialEndDate', next)}
              />
              <TextField
                label="Deneme sonrası fiyat"
                prefixIcon="payments"
                value={values.trialPrice}
                onChangeText={(next) => onChange('trialPrice', next)}
                error={errors.trialPrice}
                keyboardType="decimal-pad"
                editable={!disabled}
              />
            </>
          ) : null}

          <SelectField<SubscriptionCategory>
            label="Kategori"
            value={values.category}
            options={SUBSCRIPTION_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
            onChange={(next) => onChange('category', next)}
            disabled={disabled}
          />

          <TextField
            label="Ödeme yöntemin (isteğe bağlı)"
            prefixIcon="label-outline"
            value={values.paymentMethod}
            onChangeText={(next) => onChange('paymentMethod', next)}
            error={errors.paymentMethod}
            maxLength={80}
            editable={!disabled}
          />

          {showInitialPayment ? (
            <>
              <View style={styles.trialRow}>
                <View style={styles.trialText}>
                  <Text style={textStyle('body')}>İlk ödeme yapıldı</Text>
                  <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Ödeme geçmişine bir kayıt eklenir</Text>
                </View>
                <Switch
                  value={values.initialPaid}
                  disabled={disabled}
                  onValueChange={(next) => onChange('initialPaid', next)}
                  trackColor={{ false: colors.outline, true: withAlpha(colors.primary, 0.5) }}
                  thumbColor={values.initialPaid ? colors.primary : colors.onSurfaceVariant}
                />
              </View>
              {values.initialPaid ? (
                <DateField
                  label="Ödeme tarihi"
                  icon="event"
                  value={values.initialPaymentDate}
                  fallback={today}
                  onChange={(next) => onChange('initialPaymentDate', next)}
                />
              ) : null}
            </>
          ) : null}

          <DateField
            label="Başlangıç tarihi"
            icon="play-arrow"
            value={values.startDate}
            fallback={today}
            onChange={(next) => onChange('startDate', next)}
          />

          <TextField
            label="Notlar (isteğe bağlı)"
            prefixIcon="notes"
            value={values.notes}
            onChangeText={(next) => onChange('notes', next)}
            error={errors.notes}
            maxLength={NOTES_MAX_LENGTH}
            multiline
            editable={!disabled}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.tileMinHeight,
  },
  toggleText: {
    flex: 1,
    marginLeft: gaps.rowLoose - 2,
    marginRight: spacing.xs,
  },
  fields: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.tileMinHeight,
  },
  trialText: {
    flex: 1,
  },
});
