import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { type BillingCycle } from '../../../../core/time/calendar';
import { borderWidth, colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { ActionSheet } from '../../../../shared/widgets/ActionSheet';
import { SegmentedControl } from '../../../../shared/widgets/SegmentedControl';
import { FORM_BILLING_CYCLES, FORM_CURRENCIES, type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import type { FormChange } from './formTypes';

const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  quarterly: '3 aylık',
  yearly: 'Yıllık',
};

/** Solda para birimi çipi (alt sayfadan seçilir), sağda büyük tutar alanı. */
export function AmountRow({
  values,
  errors,
  disabled,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  disabled: boolean;
  onChange: FormChange;
}) {
  useThemeRevision();
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Para birimi: ${values.currency}`}
          accessibilityHint="Para birimini değiştirmek için dokun"
          disabled={disabled}
          onPress={() => setSheetOpen(true)}
          style={styles.currency}
        >
          <Text style={textStyle('bodyStrong')}>{values.currency}</Text>
          <MaterialIcons name="arrow-drop-down" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
        </Pressable>
        <View style={[styles.amount, errors.amount ? styles.amountError : null]}>
          <Text style={textStyle('caption')}>Tutar</Text>
          <TextInput
            accessibilityLabel="Tutar"
            value={values.amount}
            onChangeText={(next) => onChange('amount', next)}
            keyboardType="decimal-pad"
            editable={!disabled}
            placeholder="0,00"
            placeholderTextColor={colors.onSurfaceVariant}
            style={textStyle('title', { padding: spacing.none })}
          />
        </View>
      </View>
      {errors.amount ? <Text style={textStyle('caption', { color: colors.error, marginLeft: spacing.xs })}>{errors.amount}</Text> : null}
      <ActionSheet
        visible={sheetOpen}
        title="Para birimi"
        onClose={() => setSheetOpen(false)}
        items={FORM_CURRENCIES.map((code) => ({
          key: code,
          label: code,
          icon: 'attach-money' as const,
          hint: code === values.currency ? 'Seçili' : undefined,
          onPress: () => onChange('currency', code),
        }))}
      />
    </View>
  );
}

/** "Ne sıklıkla yenileniyor?" etiketi ve dört dilimli segment. */
export function BillingCycleRow({ value, disabled, onChange }: { value: BillingCycle; disabled: boolean; onChange: FormChange }) {
  useThemeRevision();
  return (
    <View style={styles.cycle}>
      <Text style={textStyle('label')}>Ne sıklıkla yenileniyor?</Text>
      <SegmentedControl<BillingCycle>
        accessibilityLabel="Yenileme sıklığı"
        options={FORM_BILLING_CYCLES.map((cycle) => ({ value: cycle, label: CYCLE_LABELS[cycle] }))}
        value={value}
        disabled={disabled}
        onChange={(next) => onChange('billingCycle', next)}
      />
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  block: {
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
    minHeight: sizes.tileMinHeight,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
  },
  amount: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surfaceHigh,
  },
  amountError: {
    borderColor: colors.error,
  },
  cycle: {
    gap: spacing.xs,
  },
}));
