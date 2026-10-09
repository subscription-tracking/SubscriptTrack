import { StyleSheet, Text, View } from 'react-native';

import { type CivilDate } from '../../../../core/time/calendar';
import { spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import { type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import { FormSection } from './FormSection';

/**
 * Flutter `FormRenewalSection`: "Yenileme" başlığı ve sonraki ödeme tarihi. Hatırlatma çipleri veri
 * sözleşmesinde yok (bkz. D4 boşlukları) ve bu sürümde gösterilmez.
 */
export function RenewalSection({
  values,
  errors,
  today,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  onChange: <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
}) {
  return (
    <FormSection>
      <View style={styles.header}>
        <Text style={textStyle('titleSmall')}>Yenileme</Text>
      </View>
      <DateField
        label="Sonraki ödeme"
        value={values.nextRenewalDate}
        fallback={today}
        error={errors.nextRenewalDate}
        onChange={(next) => onChange('nextRenewalDate', next)}
      />
    </FormSection>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xxs,
  },
});
