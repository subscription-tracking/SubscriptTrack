import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { type CivilDate } from '../../../../core/time/calendar';
import { colors, spacing, sizes, withAlpha } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { ActionSheet } from '../../../../shared/widgets/ActionSheet';
import { DateField } from '../../../../shared/widgets/DateField';
import { GroupedList, ListRow } from '../../../../shared/widgets/GroupedList';
import { TextField } from '../../../../shared/widgets/TextField';
import { CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES } from '../../domain/subscription';
import { type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import type { FormChange } from './formTypes';

/** Ek alanlar kartı: kategori, ödeme yöntemi ve ücretsiz deneme satırları. */
export function ExtrasCard({
  values,
  errors,
  today,
  disabled,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  disabled: boolean;
  onChange: FormChange;
}) {
  useThemeRevision();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const showPayment = paymentOpen || Boolean(errors.paymentMethod);
  const paymentText = values.paymentMethod.trim();

  return (
    <>
      <GroupedList>
        <ListRow
          label="Kategori"
          value={CATEGORY_LABELS[values.category]}
          accessibilityHint="Kategoriyi değiştirmek için dokun"
          onPress={disabled ? undefined : () => setCategoryOpen(true)}
        />
        <View>
          <ListRow
            label="Ödeme yöntemi"
            value={paymentText || 'Belirtilmedi'}
            accessibilityHint="Ödeme yöntemini yazmak için dokun"
            onPress={disabled ? undefined : () => setPaymentOpen((open) => !open)}
          />
          {showPayment ? (
            <View style={styles.inline}>
              <TextField
                label="Ödeme yöntemi adı"
                value={values.paymentMethod}
                onChangeText={(next) => onChange('paymentMethod', next)}
                error={errors.paymentMethod}
                maxLength={80}
                editable={!disabled}
              />
            </View>
          ) : null}
        </View>
        <View>
          <View style={styles.trialRow}>
            <View style={styles.trialText}>
              <Text style={textStyle('bodySmall')}>Ücretsiz deneme</Text>
              <Text style={textStyle('caption')}>Deneme bitince ücret alınmaya başlar</Text>
            </View>
            <Switch
              accessibilityLabel="Ücretsiz deneme"
              accessibilityHint="Deneme bitiş tarihini ve deneme sonrası fiyatı ayarlar."
              value={values.isTrial}
              disabled={disabled}
              onValueChange={(next) => onChange('isTrial', next)}
              trackColor={{ false: colors.outline, true: withAlpha(colors.primary, 0.5) }}
              thumbColor={values.isTrial ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
          {values.isTrial ? (
            <View style={styles.inline}>
              <DateField
                label="Deneme bitiş tarihi"
                value={values.trialEndDate}
                fallback={today}
                error={errors.trialEndDate}
                disabled={disabled}
                onChange={(next) => onChange('trialEndDate', next)}
              />
              <TextField
                label="Deneme sonrası fiyat"
                value={values.trialPrice}
                onChangeText={(next) => onChange('trialPrice', next)}
                error={errors.trialPrice}
                keyboardType="decimal-pad"
                editable={!disabled}
              />
            </View>
          ) : null}
        </View>
      </GroupedList>
      <ActionSheet
        visible={categoryOpen && !disabled}
        title="Kategori"
        onClose={() => setCategoryOpen(false)}
        items={SUBSCRIPTION_CATEGORIES.map((category) => ({
          key: category,
          label: CATEGORY_LABELS[category],
          icon: category === values.category ? ('check' as const) : ('label-outline' as const),
          onPress: () => onChange('category', category),
        }))}
      />
    </>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  inline: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  trialText: {
    flex: 1,
  },
}));
