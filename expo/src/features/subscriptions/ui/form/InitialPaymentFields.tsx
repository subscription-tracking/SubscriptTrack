import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import type { InitialPaymentStatus } from '../../domain/subscriptionForm';
import type { DetailsSectionProps } from './detailsTypes';
import { styles } from './detailsStyles';

const INITIAL_STATUS_OPTIONS: { value: InitialPaymentStatus; label: string }[] = [
  { value: 'paid', label: 'Ödendi' },
  { value: 'unpaid', label: 'Ödenmedi' },
  { value: 'deferred', label: 'Ertelendi' },
];

export function InitialPaymentFields({ values, today, disabled, showInitialPayment, onChange }: DetailsSectionProps) {
  useThemeRevision();
  return (<>
          {showInitialPayment ? (
            <>
              <Text style={textStyle('body')}>İlk ödeme</Text>
              <View style={styles.statusChips}>
                {INITIAL_STATUS_OPTIONS.map((option) => {
                  const selected = values.initialPaymentStatus === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      disabled={disabled}
                      onPress={() => onChange('initialPaymentStatus', option.value)}
                      style={[styles.statusChip, selected ? styles.statusChipSelected : null]}
                    >
                      <Text style={textStyle('captionStrong', { color: selected ? colors.onPrimary : colors.onSurfaceVariant })}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {values.initialPaymentStatus !== 'unpaid' ? (
                <DateField
                  label={values.initialPaymentStatus === 'deferred' ? 'Ertelenen tarih' : 'Ödeme tarihi'}
                  icon="event"
                  value={values.initialPaymentDate}
                  fallback={today}
                  onChange={(next) => onChange('initialPaymentDate', next)}
                />
              ) : null}
            </>
          ) : null}

  </>);
}
