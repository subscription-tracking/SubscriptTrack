import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { StyleSheet, Text, View } from 'react-native';

import { type CivilDate } from '../../../../core/time/calendar';
import { colors, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import { SegmentedControl } from '../../../../shared/widgets/SegmentedControl';
import { TextField } from '../../../../shared/widgets/TextField';
import { TextLink } from '../../../../shared/widgets/TextLink';
import { type FormErrors, type InitialPaymentStatus, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import type { FormChange } from './formTypes';

const NOTES_LIMIT = 2000;

const INITIAL_STATUS_OPTIONS: { value: InitialPaymentStatus; label: string }[] = [
  { value: 'paid', label: 'Ödendi' },
  { value: 'unpaid', label: 'Ödenmedi' },
  { value: 'deferred', label: 'Ertelendi' },
];

/** "Daha fazla seçenek": başlangıç tarihi, ilk ödeme (yalnızca ekleme) ve notlar. Açık/kapalı durumu üst ekrandadır. */
export function MoreOptions({
  values,
  errors,
  today,
  disabled,
  showInitialPayment,
  expanded,
  onExpandedChange,
  onChange,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  disabled: boolean;
  showInitialPayment: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: FormChange;
}) {
  useThemeRevision();
  const overLimit = values.notes.length > NOTES_LIMIT;
  return (
    <View>
      <TextLink label={expanded ? 'Daha az seçenek' : 'Daha fazla seçenek'} onPress={() => onExpandedChange(!expanded)} />
      {expanded ? (
        <View style={styles.fields}>
          <DateField
            label="Başlangıç tarihi"
            value={values.startDate}
            fallback={today}
            disabled={disabled}
            onChange={(next) => onChange('startDate', next)}
          />
          {showInitialPayment ? (
            <View style={styles.group}>
              <Text style={textStyle('label')}>İlk ödeme</Text>
              <SegmentedControl<InitialPaymentStatus>
                accessibilityLabel="İlk ödeme durumu"
                options={INITIAL_STATUS_OPTIONS}
                value={values.initialPaymentStatus}
                disabled={disabled}
                onChange={(next) => onChange('initialPaymentStatus', next)}
              />
              {values.initialPaymentStatus !== 'unpaid' ? (
                <DateField
                  label={values.initialPaymentStatus === 'deferred' ? 'Ertelenen tarih' : 'Ödeme tarihi'}
                  value={values.initialPaymentDate}
                  fallback={today}
                  disabled={disabled}
                  onChange={(next) => onChange('initialPaymentDate', next)}
                />
              ) : null}
            </View>
          ) : null}
          <View style={styles.group}>
            <TextField
              label="Notlar (isteğe bağlı)"
              value={values.notes}
              onChangeText={(next) => onChange('notes', next)}
              error={errors.notes ?? (overLimit ? 'Not en fazla 2000 karakter olabilir' : undefined)}
              multiline
              editable={!disabled}
            />
            <Text style={textStyle('caption', { textAlign: 'right', color: overLimit ? colors.error : colors.onSurfaceVariant })}>
              {`${values.notes.length} / ${NOTES_LIMIT}`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  fields: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
}));
