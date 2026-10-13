import { useThemeRevision } from '../../../../shared/design/useThemeRevision';
import { themedStyles } from '../../../../shared/design/themeRuntime';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type CivilDate } from '../../../../core/time/calendar';
import { borderWidth, colors, radius, sizes, spacing } from '../../../../shared/design/tokens';
import { textStyle } from '../../../../shared/design/typography';
import { DateField } from '../../../../shared/widgets/DateField';
import { REMINDER_PRESET_DAYS, toggleReminderDay } from '../../domain/reminderRules';
import { type FormErrors, type SubscriptionFormValues } from '../../domain/subscriptionForm';
import { FormSection } from './FormSection';

const REMINDER_LABEL: Record<(typeof REMINDER_PRESET_DAYS)[number], string> = {
  0: 'Yenileme günü',
  1: '1 gün önce',
  3: '3 gün önce',
  7: '7 gün önce',
};

/**
 * Flutter `FormRenewalSection`: "Yenileme" başlığı, sonraki ödeme tarihi ve hatırlatma çipleri (0/1/3/7 gün).
 * Birden çok çip seçilebilir; en az bir çip seçili kalmalıdır.
 */
export function RenewalSection({
  values,
  errors,
  today,
  onChange,
  scheduleMode,
  onAutomatic,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  onChange: <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => void;
  scheduleMode?: 'automatic' | 'manual';
  onAutomatic?: () => void;
}) {
  useThemeRevision();
  return (
    <FormSection>
      <View style={styles.header}>
        <Text style={textStyle('bodyStrong')}>Yenileme</Text>
      </View>
      <DateField
        label="Sonraki ödeme"
        value={values.nextRenewalDate}
        fallback={today}
        error={errors.nextRenewalDate}
        onChange={(next) => onChange('nextRenewalDate', next)}
      />
      {scheduleMode === 'automatic' ? <Text style={textStyle('caption')}>Tarih otomatik hesaplanıyor · Elle seç</Text> : null}
      {scheduleMode === 'manual' && onAutomatic ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Elle seçildi, otomatik hesapla" onPress={onAutomatic} style={styles.scheduleLink}>
          <Text style={textStyle('caption', { color: colors.primary })}>Elle seçildi · Otomatik hesapla</Text>
        </Pressable>
      ) : null}
      <Text style={textStyle('caption', { color: colors.onSurfaceVariant, marginTop: spacing.md })}>Hatırlat</Text>
      <View style={styles.chips}>
        {REMINDER_PRESET_DAYS.map((day) => {
          const selected = values.reminderDays.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange('reminderDays', toggleReminderDay(values.reminderDays, day))}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={textStyle('captionStrong', { color: selected ? colors.onPrimary : colors.onSurfaceVariant })}>{REMINDER_LABEL[day]}</Text>
            </Pressable>
          );
        })}
      </View>
      {errors.reminderDays ? <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xs })}>{errors.reminderDays}</Text> : null}
    </FormSection>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  header: {
    marginBottom: spacing.xxs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.choice,
    borderWidth: borderWidth.statsEdge,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surfaceHigh,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  scheduleLink: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
  },
}));
