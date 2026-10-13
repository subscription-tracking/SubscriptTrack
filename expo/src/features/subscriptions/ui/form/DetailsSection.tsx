import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, sizes } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import { SelectField } from '../../../../shared/widgets/SelectField';
import { TextField } from '../../../../shared/widgets/TextField';
import { CATEGORY_LABELS, SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '../../domain/subscription';
import type { DetailsSectionProps } from './detailsTypes';
import { TrialFields } from './TrialFields';
import { InitialPaymentFields } from './InitialPaymentFields';
import { styles } from './detailsStyles';

/** Diğer ayrıntılar: deneme ve ilk ödeme alanları ayrı sunum bölümleridir. */
export function DetailsSection({
  values,
  errors,
  today,
  disabled,
  showInitialPayment,
  expanded: controlledExpanded,
  onExpandedChange,
  onChange,
}: DetailsSectionProps) {
  useThemeRevision();
  const [ownExpanded, setOwnExpanded] = useState(false);
  const expanded = controlledExpanded ?? ownExpanded;
  const setExpanded = (update: (open: boolean) => boolean) => {
    const next = update(expanded);
    if (onExpandedChange) onExpandedChange(next);
    else setOwnExpanded(next);
  };
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diğer ayrıntılar"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((open) => !open)}
        style={styles.toggle}
      >
        <MaterialIcons name="tune" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
        <View style={styles.toggleText}>
          <Text style={textStyle('body')}>Diğer ayrıntılar</Text>
          <Text style={textStyle('bodySmall', { color: colors.onSurfaceVariant })}>Kategori, deneme, ödeme yöntemi ve not</Text>
        </View>
        <MaterialIcons name={expanded ? 'expand-less' : 'chevron-right'} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>

      {expanded ? (
        <View style={styles.fields}>
          <TrialFields values={values} errors={errors} today={today} disabled={disabled} showInitialPayment={showInitialPayment} onChange={onChange} />

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

          <InitialPaymentFields values={values} errors={errors} today={today} disabled={disabled} showInitialPayment={showInitialPayment} onChange={onChange} />

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
            error={errors.notes ?? (values.notes.length > 2000 ? 'Not en fazla 2000 karakter olabilir' : undefined)}
            multiline
            editable={!disabled}
          />
        </View>
      ) : null}
    </View>
  );
}
