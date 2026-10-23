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
import type { FormChange } from './formTypes';

const REMINDER_LABEL: Record<(typeof REMINDER_PRESET_DAYS)[number], string> = {
  0: 'Yenileme günü',
  1: '1 gün önce',
  3: '3 gün önce',
  7: '7 gün önce',
};

/**
 * Yenileme kartı: sonraki ödeme tarihi (otomatik ya da elle), altında tek satır durum ve hatırlatma çipleri
 * (0/1/3/7 gün). Birden çok çip seçilebilir; en az biri seçili kalır.
 */
export function RenewalCard({
  values,
  errors,
  today,
  scheduleMode,
  onChange,
  onAutomatic,
}: {
  values: SubscriptionFormValues;
  errors: FormErrors;
  today: CivilDate;
  scheduleMode: 'automatic' | 'manual';
  onChange: FormChange;
  onAutomatic: () => void;
}) {
  useThemeRevision();
  return (
    <FormSection title="Yenileme ve hatırlatma">
      <View>
        <DateField
          label="Sonraki ödeme"
          value={values.nextRenewalDate}
          fallback={today}
          error={errors.nextRenewalDate}
          onChange={(next) => onChange('nextRenewalDate', next)}
        />
        {scheduleMode === 'automatic' ? (
          <Text style={textStyle('caption', { marginTop: spacing.xs })}>Başlangıç tarihine göre otomatik hesaplandı.</Text>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Elle seçildi, otomatik hesapla" onPress={onAutomatic} style={styles.scheduleLink}>
            <Text style={textStyle('caption', { color: colors.primary })}>Elle seçildi · Otomatik hesapla</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.reminders}>
        <Text style={textStyle('label')}>Hatırlat</Text>
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
        {errors.reminderDays ? <Text style={textStyle('caption', { color: colors.error })}>{errors.reminderDays}</Text> : null}
      </View>
    </FormSection>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  scheduleLink: {
    minHeight: sizes.minTouchTarget,
    justifyContent: 'center',
  },
  reminders: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.choice,
    borderWidth: borderWidth.statsEdge,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
}));
