import { useThemeRevision } from '../design/useThemeRevision';
import { themedStyles } from '../design/themeRuntime';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, opacity, radius, sizes, spacing, withAlpha } from '../design/tokens';
import { textStyle } from '../design/typography';

/**
 * Flutter `FilledButton` (tema, tam genişlik, 50 px): birincil veya tehlikeli ton. Meşgulken yükleme göstergesi çıkar.
 */
export function FilledButtonLabel({
  label,
  busy = false,
  disabled = false,
  tone = 'primary',
  onPress,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'danger';
  onPress: () => void;
}) {
  useThemeRevision();
  const inactive = busy || disabled;
  const background = tone === 'danger' ? colors.error : colors.primary;
  const foreground = tone === 'danger' ? colors.white : colors.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: inactive ? withAlpha(colors.onBackground, opacity.disabledContainer) : background },
        pressed && !inactive ? styles.pressed : null,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Text style={textStyle('bodyStrong', { color: inactive ? withAlpha(colors.onBackground, opacity.disabled) : foreground })}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  button: {
    minHeight: sizes.primaryButtonHeight,
    borderRadius: radius.field + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
}));
