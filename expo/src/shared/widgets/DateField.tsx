import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { civilDate, type CivilDate } from '../../core/time/calendar';
import { formatLongDate } from '../../core/format/date';
import { borderWidth, colors, radius, sizes, spacing } from '../design/tokens';
import { textStyle } from '../design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Flutter `FormDateTile` karşılığı: ikonlu, 12 köşeli, 0.5 kenarlıklı satır; başlık ve değer. Dokununca yerel
 * tarih seçici açılır. Değer takvim günü olarak tutulur.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  fallback,
  icon,
  disabled = false,
}: {
  label: string;
  value: CivilDate | null;
  onChange: (next: CivilDate) => void;
  error?: string | null;
  fallback: CivilDate;
  icon?: MaterialIconName;
  disabled?: boolean;
}) {
  useThemeRevision();
  const [open, setOpen] = useState(false);
  const shown = value ?? fallback;

  function handleChange(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (disabled || event.type === 'dismissed' || !picked) return;
    onChange(civilDate(picked.getFullYear(), picked.getMonth() + 1, picked.getDate()));
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatLongDate(value) : 'seçilmedi'}`}
        accessibilityHint={error ? `Hata: ${error}` : undefined}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.tile, error ? styles.tileError : null]}
      >
        {icon ? <MaterialIcons name={icon} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} /> : null}
        <View style={[styles.texts, icon ? styles.textsWithIcon : null]}>
          <Text style={textStyle('body')}>{label}</Text>
          <Text style={textStyle('bodySmall', { color: value ? colors.onSurface : colors.onSurfaceVariant })}>
            {value ? formatLongDate(value) : 'Tarih seç'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>
      {error ? <Text accessibilityLiveRegion="polite" style={textStyle('caption', { color: colors.error, marginTop: spacing.xxs, marginLeft: spacing.md })}>{error}</Text> : null}
      {open && !disabled ? (
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

const styles = themedStyles(() => StyleSheet.create({
  tile: {
    minHeight: sizes.tileMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.field,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
  },
  tileError: {
    borderColor: colors.error,
  },
  texts: {
    flex: 1,
  },
  textsWithIcon: {
    marginLeft: spacing.md,
  },
}));
