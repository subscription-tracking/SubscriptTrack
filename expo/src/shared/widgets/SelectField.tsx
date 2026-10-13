import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LockAwareModal } from './LockAwareModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { borderWidth, colors, radius, spacing, sizes } from '../design/tokens';
import { textStyle } from '../design/typography';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Flutter `DropdownButtonFormField` karşılığı: kenarlıklı alan, üstte küçük etiket, değer ve aşağı ok.
 * Dokununca alttan açılan seçim listesi gelir.
 */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  prefix,
  error,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (next: T) => void;
  prefix?: ReactNode;
  error?: string | null;
  disabled?: boolean;
}) {
  useThemeRevision();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? ''}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        {prefix ? <View style={styles.prefix}>{prefix}</View> : null}
        <View style={styles.texts}>
          <Text style={textStyle('caption', { color: colors.onSurfaceVariant })}>{label}</Text>
          <Text numberOfLines={1} style={textStyle('bodyStrong')}>
            {selected?.label ?? ''}
          </Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
      </Pressable>
      {error ? <Text style={textStyle('caption', { color: colors.error, marginTop: spacing.xxs, marginLeft: spacing.md })}>{error}</Text> : null}

      <LockAwareModal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Kapat" style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={textStyle('bodyStrong', { marginBottom: spacing.sm })}>{label}</Text>
          <FlatList
            data={[...options]}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.value === value }}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={textStyle('body', { color: item.value === value ? colors.primary : colors.onSurface })}>{item.label}</Text>
                {item.value === value ? <MaterialIcons name="check" size={sizes.checkIcon} color={colors.primary} /> : null}
              </Pressable>
            )}
          />
        </View>
      </LockAwareModal>
    </View>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  field: {
    minHeight: sizes.minTouchTarget + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    backgroundColor: colors.surfaceHigh,
  },
  fieldError: {
    borderColor: colors.error,
  },
  prefix: {
    marginRight: spacing.xs,
  },
  texts: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  sheet: {
    maxHeight: '60%',
    padding: spacing.lg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surfaceLow,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: sizes.minTouchTarget,
  },
}));
