import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { spacing , borderWidth, colors, radius, sizes } from '../design/tokens';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


import { fontFamily } from '../design/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  /** Flutter `labelText`. Alan boş ve odakta değilken içeride, aksi halde üstte görünür. */
  label: string;
  /** Flutter `prefixIcon`. */
  prefixIcon?: MaterialIconName;
  /** Özel önek (Flutter `prefixIcon` widget'ı); verilirse `prefixIcon` yerine kullanılır. */
  prefix?: ReactNode;
  /** Flutter `suffixIcon` (örn. parola görünürlük düğmesi). */
  suffix?: ReactNode;
  /** Doğrulama hatası; alanın altında gösterilir (Flutter `validator` metni). */
  error?: string | null;
}

/**
 * Flutter `InputDecoration` (filled, outline) karşılığı: surfaceHigh dolgu,
 * 14 köşe, 0.5 kenarlık, odakta 1.5 primary kenarlık, etiket içeride → üstte.
 */
export function TextField({ label, prefixIcon, prefix, suffix, error, editable = true, value, onFocus, onBlur, placeholder, ...inputProps }: TextFieldProps) {
  useThemeRevision();
  const [focused, setFocused] = useState(false);
  const floating = focused || (value ?? '').length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
          !editable && styles.fieldDisabled,
        ]}
      >
        {prefix ? <View style={styles.prefixSlot}>{prefix}</View> : prefixIcon ? (
          <MaterialIcons name={prefixIcon} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} style={styles.prefix} />
        ) : null}
        <View style={styles.inputArea}>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.labelLayer, floating && styles.labelLayerFloating]}>
            <Text
              style={[
                styles.label,
                floating ? styles.labelFloating : styles.labelInline,
                focused && !error && styles.labelFocused,
                error ? styles.labelError : null,
              ]}
            >
              {label}
            </Text>
          </View>
          <TextInput
            accessibilityLabel={label}
            accessibilityState={{ disabled: !editable }}
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
            editable={editable}
            value={value}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[styles.input, floating && styles.inputFloating]}
            {...inputProps}
            placeholder={focused ? placeholder : undefined}
          />
        </View>
        {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/** Flutter `IconButton` (görünürlük düğmesi) için 48 px dokunma alanı. */
export function FieldIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: MaterialIconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  useThemeRevision();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={styles.iconButton}
    >
      <MaterialIcons name={icon} size={sizes.iconButtonSize} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  wrapper: {
    gap: spacing.xxs,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.small,
    borderWidth: borderWidth.regular,
    borderColor: colors.controlBorder,
    paddingLeft: spacing.md,
    paddingRight: spacing.xxs,
  },
  fieldFocused: {
    borderColor: colors.primary,
    borderWidth: borderWidth.focused,
  },
  fieldError: {
    borderColor: colors.error,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  prefix: {
    marginRight: spacing.sm,
  },
  prefixSlot: {
    padding: spacing.xs,
    marginRight: spacing.xxs,
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingVertical: spacing.xs,
  },
  labelLayer: {
    justifyContent: 'center',
  },
  labelLayerFloating: {
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  label: {
    fontFamily,
    color: colors.onSurfaceVariant,
  },
  labelInline: {
    fontSize: 16,
  },
  labelFloating: {
    fontSize: 12,
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  input: {
    fontFamily,
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: spacing.none,
    minHeight: 24,
  },
  inputFloating: {
    // Üstteki etiket bandının (8 px boşluk + ~16 px satır) altına inen değer.
    paddingTop: spacing.xl,
  },
  suffix: {
    marginLeft: spacing.xxs,
  },
  iconButton: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily,
    color: colors.error,
    fontSize: 12,
    paddingLeft: spacing.md,
  },
}));
