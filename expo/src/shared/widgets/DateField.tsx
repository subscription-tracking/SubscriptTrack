import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { civilDate, type CivilDate } from '../../core/time/calendar';
import { formatLongDate } from '../../core/format/date';
import { borderWidth, colors, radius, sizes, spacing } from '../design/tokens';
import { fontFamily } from '../design/typography';
import { Spacer } from './Spacer';
import { textStyle } from '../design/typography';

/** Etiketli tarih alanı. Dokununca yerel tarih seçici açılır. Değer takvim günü olarak tutulur. */
export function DateField({
  label,
  value,
  onChange,
  error,
  fallback,
}: {
  label: string;
  value: CivilDate | null;
  onChange: (next: CivilDate) => void;
  error?: string | null;
  fallback: CivilDate;
}) {
  const [open, setOpen] = useState(false);
  const shown = value ?? fallback;

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !picked) return;
    onChange(civilDate(picked.getFullYear(), picked.getMonth() + 1, picked.getDate()));
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Spacer size={spacing.xxs} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatLongDate(value) : 'seçilmedi'}`}
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatLongDate(value) : 'Tarih seç'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={new Date(shown.year, shown.month - 1, shown.day)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily,
    ...textStyle('caption'),
    color: colors.onSurfaceVariant,
  },
  field: {
    minHeight: sizes.minTouchTarget + 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.small,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  fieldError: {
    borderColor: colors.error,
  },
  value: {
    fontFamily,
    fontSize: 16,
    color: colors.onSurface,
  },
  placeholder: {
    color: colors.onSurfaceVariant,
  },
  error: {
    fontFamily,
    fontSize: 12,
    color: colors.error,
    paddingLeft: spacing.md,
    marginTop: spacing.xxs,
  },
});
