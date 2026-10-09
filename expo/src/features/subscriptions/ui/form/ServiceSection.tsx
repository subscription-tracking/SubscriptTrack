import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { type BillingCycle } from '../../../../core/time/calendar';
import { borderWidth, colors, gaps, radius, spacing, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { SelectField } from '../../../../shared/widgets/SelectField';
import { TextField } from '../../../../shared/widgets/TextField';
import { BILLING_CYCLE_LABELS } from '../../domain/subscription';
import { FORM_BILLING_CYCLES, FORM_CURRENCIES, type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import { type ServicePreset } from '../../domain/servicePresets';
import { ServiceIdentity } from '../ServiceIdentity';
import { FormSection } from './FormSection';

/**
 * Flutter `FormServiceSection`: (yalnızca ekleme) popüler servis çipleri, servis adı (canlı marka ikonu
 * önekiyle), para birimi ve tutar yan yana, yenileme sıklığı. Ad bir servisle eşleşirse kategori de gelir.
 */
export function ServiceSection({
  values,
  errors,
  presets,
  showPresets,
  disabled,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  presets: readonly ServicePreset[];
  showPresets: boolean;
  disabled: boolean;
  onChange: <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
}) {
  const currentName = values.name.trim().toLowerCase();

  function pickPreset(preset: ServicePreset) {
    onChange('name', preset.name);
    onChange('category', preset.category);
  }

  function nameChanged(next: string) {
    onChange('name', next);
    const match = presets.find((preset) => preset.name.trim().toLowerCase() === next.trim().toLowerCase());
    if (match) onChange('category', match.category);
  }

  return (
    <FormSection>
      {showPresets ? (
        <View style={styles.presetsBlock}>
          <Text style={textStyle('formLabel', { color: withAlpha(colors.onSurface, 0.6) })}>
            Popüler servisler
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {presets.map((preset) => {
              const selected = currentName === preset.name.trim().toLowerCase();
              return (
                <Pressable
                  key={preset.name}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => pickPreset(preset)}
                  style={[styles.preset, { borderColor: selected ? colors.primary : colors.outlineHalf, borderWidth: selected ? borderWidth.focused + 0.5 : borderWidth.hairline }]}
                >
                  <ServiceIdentity name={preset.name} category={preset.category} size={26} />
                  <Text style={textStyle(selected ? 'presetLabelStrong' : 'presetLabel', { marginLeft: spacing.xs })}>{preset.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <TextField
        label="Servis"
        placeholder="Örn. Netflix"
        value={values.name}
        onChangeText={nameChanged}
        error={errors.name}
        maxLength={160}
        editable={!disabled}
        prefix={<ServiceIdentity name={values.name} category={values.category} size={28} />}
      />

      <View style={styles.row}>
        <View style={styles.currency}>
          <SelectField
            label="Para birimi"
            value={values.currency}
            options={FORM_CURRENCIES.map((code) => ({ value: code, label: code }))}
            onChange={(next) => onChange('currency', next)}
            disabled={disabled}
          />
        </View>
        <View style={styles.amount}>
          <TextField
            label="Tutar"
            value={values.amount}
            onChangeText={(next) => onChange('amount', next)}
            error={errors.amount}
            keyboardType="decimal-pad"
            editable={!disabled}
          />
        </View>
      </View>

      <SelectField<BillingCycle>
        label="Yenileme sıklığı"
        value={values.billingCycle}
        options={FORM_BILLING_CYCLES.map((cycle) => ({ value: cycle, label: BILLING_CYCLE_LABELS[cycle] }))}
        onChange={(next) => onChange('billingCycle', next)}
        disabled={disabled}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  presetsBlock: {
    gap: spacing.xs,
  },
  presetRow: {
    gap: gaps.hint + 2,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: gaps.chip,
    borderRadius: radius.field + 2,
    backgroundColor: colors.surfaceHigh,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  currency: {
    width: 150,
  },
  amount: {
    flex: 1,
  },
});
